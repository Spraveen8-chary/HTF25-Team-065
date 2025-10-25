import os
import uuid
from flask import Flask, render_template, request, jsonify, send_file, redirect, url_for, flash
from flask_login import LoginManager, login_required, current_user
from werkzeug.utils import secure_filename
from config import Config
from models import db, User, VideoProcessing
from auth import auth as auth_blueprint
from utils.video_processor import VideoProcessor
from utils.transcription import TranscriptionService
from utils.caption_formatter import CaptionFormatter

app = Flask(__name__)
app.config.from_object(Config)
Config.init_app(app)

# Initialize database
db.init_app(app)

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth.login'
login_manager.login_message = 'Please log in to access this page.'

# Register auth blueprint
app.register_blueprint(auth_blueprint, url_prefix='/auth')

# Initialize services
video_processor = VideoProcessor(app.config['UPLOAD_FOLDER'])
transcription_service = TranscriptionService(app.config['GOOGLE_API_KEY'])
caption_formatter = CaptionFormatter()


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


# Create database tables
with app.app_context():
    db.create_all()


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']


@app.route('/')
@login_required
def index():
    """Render main page"""
    return render_template(
        'index.html',
        styles=app.config['CAPTION_STYLES'],
        user=current_user,
        videos_processed=current_user.get_video_count(),
        can_process=current_user.can_process_video()
    )


@app.route('/upload', methods=['POST'])
@login_required
def upload_video():
    """Handle video upload"""
    try:
        # Check usage limit
        if not current_user.can_process_video():
            return jsonify({
                'error': 'You have reached your free limit (2 videos). Please upgrade to premium to continue.',
                'upgrade_required': True
            }), 403
        
        # Check if file is present
        if 'video' not in request.files:
            return jsonify({'error': 'No video file provided'}), 400
        
        file = request.files['video']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file type
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Allowed: MP4, MOV, AVI, MKV, WebM'}), 400
        
        # Generate unique filename
        original_filename = secure_filename(file.filename)
        unique_id = str(uuid.uuid4())[:8]
        filename = f"{unique_id}_{original_filename}"
        
        # Save file
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        return jsonify({
            'success': True,
            'file_id': unique_id,
            'filename': filename,
            'original_filename': original_filename,
            'message': 'Video uploaded successfully'
        }), 200
        
    except Exception as e:
        app.logger.error(f"Upload error: {str(e)}")
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500


@app.route('/process', methods=['POST'])
@login_required
def process_video():
    """Process video and generate captions"""
    try:
        # Check usage limit again
        if not current_user.can_process_video():
            return jsonify({
                'error': 'You have reached your free limit (2 videos). Please upgrade to premium.',
                'upgrade_required': True
            }), 403
        
        data = request.get_json()
        filename = data.get('filename')
        original_filename = data.get('original_filename', filename)
        style = data.get('style', 'meme')
        language = data.get('language', 'en')
        
        if not filename:
            return jsonify({'error': 'Filename is required'}), 400
        
        if style not in app.config['CAPTION_STYLES']:
            return jsonify({'error': 'Invalid caption style'}), 400
        
        video_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        if not os.path.exists(video_path):
            return jsonify({'error': 'Video file not found'}), 404
        
        # Step 1: Extract audio from video
        app.logger.info(f"Extracting audio from {filename}")
        audio_path = video_processor.extract_audio(video_path)
        
        # Step 2: Transcribe audio using Gemini
        app.logger.info(f"Transcribing audio with language: {language}")
        transcript = transcription_service.transcribe(audio_path, language)
        
        # Step 3: Format captions based on selected style
        app.logger.info(f"Formatting captions in {style} style")
        formatted_captions = caption_formatter.format(transcript, style)
        
        # Step 4: Generate SRT file
        srt_filename = f"{filename.rsplit('.', 1)[0]}_{style}.srt"
        srt_path = os.path.join(app.config['UPLOAD_FOLDER'], srt_filename)
        caption_formatter.generate_srt(formatted_captions, srt_path)
        
        # Step 5: Save to database
        video_record = VideoProcessing(
            user_id=current_user.id,
            filename=filename,
            original_filename=original_filename,
            style=style,
            language=language,
            srt_filename=srt_filename,
            duration=transcript.get('duration', 0),
            status='completed'
        )
        db.session.add(video_record)
        db.session.commit()
        
        # Cleanup audio file
        video_processor.cleanup_file(audio_path)
        
        return jsonify({
            'success': True,
            'srt_filename': srt_filename,
            'captions': formatted_captions[:10],  # Return first 10 for preview
            'total_captions': len(formatted_captions),
            'videos_processed': current_user.get_video_count(),
            'videos_remaining': 2 - current_user.get_video_count() if not current_user.is_premium else 'unlimited',
            'message': 'Captions generated successfully'
        }), 200
        
    except Exception as e:
        app.logger.error(f"Processing error: {str(e)}")
        return jsonify({'error': f'Processing failed: {str(e)}'}), 500


@app.route('/download/<filename>')
@login_required
def download_file(filename):
    """Download generated SRT file"""
    try:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(filename))
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'File not found'}), 404
        
        return send_file(
            filepath,
            as_attachment=True,
            download_name=filename,
            mimetype='application/x-subrip'
        )
        
    except Exception as e:
        app.logger.error(f"Download error: {str(e)}")
        return jsonify({'error': f'Download failed: {str(e)}'}), 500


@app.route('/cleanup/<filename>', methods=['DELETE'])
@login_required
def cleanup(filename):
    """Cleanup uploaded video file"""
    try:
        video_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(filename))
        video_processor.cleanup_file(video_path)
        
        return jsonify({
            'success': True,
            'message': 'File cleaned up successfully'
        }), 200
        
    except Exception as e:
        app.logger.error(f"Cleanup error: {str(e)}")
        return jsonify({'error': f'Cleanup failed: {str(e)}'}), 500


@app.route('/history')
@login_required
def history():
    """View processing history"""
    videos = VideoProcessing.query.filter_by(user_id=current_user.id).order_by(VideoProcessing.processed_at.desc()).all()
    return render_template('history.html', videos=videos, user=current_user)


@app.errorhandler(413)
def file_too_large(e):
    """Handle file too large error"""
    return jsonify({
        'error': f'File too large. Maximum size: {app.config["MAX_CONTENT_LENGTH"] // (1024*1024)}MB'
    }), 413


@app.errorhandler(500)
def internal_error(e):
    """Handle internal server error"""
    app.logger.error(f"Internal error: {str(e)}")
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

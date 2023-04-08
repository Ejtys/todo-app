from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField
from wtforms.validators import InputRequired



app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///tasks.db'
app.config['SECRET_KEY'] = 'your_secret_key'
db = SQLAlchemy(app)
CORS(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)

    def __repr__(self):
        return f'<User {self.username}>'

class RegistrationForm(FlaskForm):
    username = StringField('username', validators=[InputRequired()])
    password = PasswordField('password', validators=[InputRequired()])

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    form = RegistrationForm()

    if form.validate_on_submit():
        username = form.username.data
        password = form.password.data
        existing_user = User.query.filter_by(username=username).first()

        if existing_user:
            flash('Username already exists. Please choose a different one.')
        else:
            new_user = User(username=username, password=password)
            db.session.add(new_user)
            db.session.commit()
            login_user(new_user)
            return redirect(url_for('index'))

    return render_template('signup.html', form=form)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    done = db.Column(db.Boolean, default=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def __init__(self, title, user_id, done=False):
        self.title = title
        self.done = done
        self.user_id = user_id

def create_database():
    with app.app_context():
        db.create_all()


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        if user and user.password == password:
            login_user(user)
            return redirect(url_for('index'))
        else:
            flash('Invalid username or password')
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/tasks', methods=['GET'])
@login_required
def get_tasks():
    tasks = Task.query.filter_by(user_id=current_user.id).all()
    return jsonify([{'id': task.id, 'title': task.title, 'done': task.done} for task in tasks])


@app.route('/tasks', methods=['POST'])
@login_required
def add_task():
    title = request.get_json()['title']
    done = request.get_json()['done']
    task = Task(title=title, done=done, user_id=current_user.id)
    db.session.add(task)
    db.session.commit()
    return jsonify({'id': task.id, 'title': task.title, 'done': task.done}), 200

@app.route('/tasks/<int:task_id>', methods=['PUT'])
@login_required
def update_task(task_id):
    task_data = request.get_json()
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first_or_404()
    task.done = task_data['done']
    db.session.commit()
    return jsonify({'id': task.id, 'text': task.text, 'done': task.done})

@app.route('/tasks/<int:task_id>', methods=['DELETE'])
@login_required
def delete_task(task_id):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first_or_404()
    db.session.delete(task)
    db.session.commit()
    return jsonify({'result': 'success'})



if __name__ == '__main__':
    create_database()
    app.run(debug=True)

# Django Web Application

This is a Django web application featuring a chat interface powered by OpenAI's API and a notes area.

## Setup Instructions

Follow these steps to get the project up and running on your local machine.

### 1. Clone the Repository

```bash
git clone <repository_url>
cd djangoweb
```

### 2. Create and Activate a Virtual Environment

It's recommended to use a virtual environment to manage project dependencies.

```bash
python -m venv venv
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# .venv\Scripts\activate
```

### 3. Install Dependencies

This project uses `uv` for dependency management. Ensure you have `uv` installed. If not, you can install it via pip:

```bash
pip install uv
```

Then, install the project dependencies:

```bash
uv pip install -e .
# Or simply:
uv sync
```

### 4. Environment Variables

Create a `.env` file in the root directory of the project based on the `.env.example` file:

```bash
cp .env.example .env
```

Open the newly created `.env` file and fill in your actual API keys and secret key:

```
OPENAI_API_KEY=your_openai_api_key_here
SECRET_KEY=your_django_secret_key_here
```

Replace `your_openai_api_key_here` with your actual OpenAI API key and `your_django_secret_key_here` with a strong, random string for Django's `SECRET_KEY`.

### 5. Database Migrations

Apply the database migrations:

```bash
python manage.py migrate
```

### 6. Collect Static Files

Collect static files for the project:

```bash
python manage.py collectstatic --noinput
```

### 7. Run the Development Server

```bash
python manage.py runserver
```

The application should now be accessible at `http://127.0.0.1:8000/`.

## Usage

Once the server is running, navigate to `http://127.00.1:8000/` in your web browser. You will see a chat interface. Type your message in the input box and click "Send" to interact with the AI. The AI's response will be streamed to the chat display. After the AI's response is complete, the notes area will be updated with a placeholder "Lorem ipsum" text.

## Project Structure

- `djangoweb/`: Main Django project configuration.
- `app/`: Django application containing views, templates, static files, and URLs.
- `app/templates/`: HTML templates.
- `app/static/css/`: CSS files.
- `app/static/js/`: JavaScript files.
- `pyproject.toml`: Project metadata and dependencies managed by `uv`.
- `.env.example`: Example environment variables.
- `.gitignore`: Specifies intentionally untracked files to ignore by Git.

## License

[Optional: Add your license information here, e.g., MIT License, Apache 2.0 License, etc.]

# Backend Environment

The backend is an API that is build on the Flask framework.

</br></br>


## Virtual Environment

It's recommended to use a Python virtual environment.

Create the environment:
```bash
python -m venv .venv
```
</br></br>


Activate the environment (Windows):
```bash
.venv\Scripts\activate
```
</br></br>


Activate the environment (Linux/Mac):
```bash
source .venv/bin/activate
```
</br></br>


## Python Packages

Required packages are:

* **Flask** - Web framework for the backend API
* **Flask-CORS** - Cross-Origin Resource Sharing support for API
* **Flask-Session** - To manage objects within a Flask session

</br></br>


Install these requirements with:
```bash
pip install -r requirements.txt
```

</br></br>


---
# Running the API

Start the API process. This will run on port 5000:

```bash
python -m backend.app
```

</br></br>


---
# Testing API Endpoints

Endpoint tests use `pytest` with Flask's test client.

Install dependencies first:
```bash
pip install -r requirements.txt
```

Run all API endpoint tests:
```bash
pytest -q
```

Run smoke tests only:
```bash
pytest -q tests/test_smoke.py
```

Run coverage report:
```bash
pytest --cov=. --cov-report=term-missing
```

These tests target HTTP endpoint behavior only.

</br></br>


---
# Database

The backend process accesses a database through SQLite. The DB file is `database/maps.db`.

If this file does not exist, it will be created when the application runs for the first time.

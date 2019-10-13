cd /root/rmote.app
uwsgi --socket 0.0.0.0:5000 --master --threads 4 -w app:app
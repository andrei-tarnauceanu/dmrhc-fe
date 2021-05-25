from datetime import datetime, timedelta
from pymongo import MongoClient
from flask import Flask, request, url_for, render_template, make_response, abort
from jinja2 import Template
import json, os

app = Flask(__name__)

MONGO_USER = os.getenv('MONGO_USER')
MONGO_PASS = os.getenv('MONGO_PASS')
MONGO_DB = os.getenv('MONGO_DB')
mongo_uri = f"mongodb+srv://{MONGO_USER}:{MONGO_PASS}@cluster0.rwier.mongodb.net/{MONGO_DB}?retryWrites=true&w=majority"


@app.route('/')
def root():
    records = get_records(single_record=True)
    rssi = records['rssi']
    gps_location = records['gps_location']
    with open('templates/template.html', 'r') as f:
        text = f.read()
    template = Template(text)
    return template.render(latitude=gps_location.get("latitude"),
                           longitude=gps_location.get("longitude"),
                           rssi=rssi,
                           zoom=19)


@app.route('/markers')
def get_markers():
    now = bool(request.args.get("now", False))
    start = request.args.get("start", None)
    end = request.args.get("end", None)
    if start is None and end is None:
        now = True
    if now:
        start = datetime.utcnow() - timedelta(minutes=5)
        end = datetime.utcnow()
        return json.dumps(get_records(start, end, True))
    return json.dumps(get_records(start, end))


def get_records(start=datetime.utcnow() - timedelta(minutes=5), end=datetime.utcnow(), single_record=False):
    client = MongoClient(mongo_uri)
    db = client.DMRHC
    query = {
        "received_at":
                 {
                     "$gte": f"{start.strftime('%Y-%m-%dT%H:%M:%SZ')}",
                     "$lt":  f"{end.strftime('%Y-%m-%dT%H:%M:%SZ')}"
                 }
            }
    cursor = db.pytrack.find(query)
    records = []
    for x in sorted(cursor, key=lambda k: k['received_at'], reverse=True):
        if x['uplink_message']['decoded_payload'].get("gps_1", None) and single_record:
            return {"time": x['received_at'], "rssi": x['uplink_message']['rx_metadata'][0]['rssi'], "gps_location": x['uplink_message']['decoded_payload'].get("gps_1", None)}
        records.append({"time": x['received_at'], "rssi": x['uplink_message']['rx_metadata'][0]['rssi'], "gps_location": x['uplink_message']['decoded_payload'].get("gps_1", None)})
    if single_record and len(records) == 0:
        return {"time": 0, "rssi": 0, "gps_location": {"latitude": 0, "longitude": 0}}
    else:
        return records


if __name__ == '__main__':
    app.run(debug=True)
"""Serialization helpers for MongoDB documents."""
from datetime import datetime, date, time
from bson import ObjectId


def serialize_doc(doc: dict) -> dict:
    """Convert MongoDB document to JSON-safe dict."""
    if doc is None:
        return None
    result = {}
    for key, value in doc.items():
        if key == "_id":
            continue  # skip mongo _id
        elif isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, datetime):
            result[key] = value.isoformat()
        elif isinstance(value, date):
            result[key] = value.isoformat()
        elif isinstance(value, time):
            result[key] = value.isoformat()
        else:
            result[key] = value
    return result


def serialize_list(docs: list) -> list:
    return [serialize_doc(d) for d in docs]

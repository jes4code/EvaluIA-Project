# rubricas_repo.py
from database import db
from bson import ObjectId

collection = db["rubricas"]

def crear_rubrica(rubrica_json):
    resultado = collection.insert_one(rubrica_json)
    return str(resultado.inserted_id)

def obtener_rubricas(profesor_email):
    # Ocultamos _id en la consulta (lo convertimos manualmente luego si se necesita)
    rubricas = list(collection.find({"creador": profesor_email}))
    for r in rubricas:
        r["_id"] = str(r["_id"])
    return rubricas

def editar_rubrica(rubrica_id, nuevos_datos):
    resultado = collection.update_one(
        {"_id": ObjectId(rubrica_id)},
        {"$set": nuevos_datos}
    )
    return resultado.modified_count > 0

def eliminar_rubrica(rubrica_id):
    resultado = collection.delete_one({"_id": ObjectId(rubrica_id)})
    return resultado.deleted_count > 0

def obtener_rubrica_por_id(rubrica_id):
    doc = collection.find_one({"_id": ObjectId(rubrica_id)})
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc


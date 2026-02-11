from database import db
from passlib.context import CryptContext
from datetime import datetime, timezone

collection = db["usuarios"]

# Configuración para encriptar contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verificar_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)

def crear_usuario(usuario_json):
    # Revisar si ya existe el email
    if collection.find_one({"email": usuario_json["email"]}):
        raise ValueError("El email ya está registrado")
    
    # Hashear contraseña antes de guardar
    usuario_json["password_hash"] = hash_password(usuario_json.pop("password"))

    usuario_json["fecha_registro"] = datetime.now(timezone.utc)

    
    resultado = collection.insert_one(usuario_json)
    return str(resultado.inserted_id)

def obtener_usuario_por_email(email: str):
    return collection.find_one({"email": email}, {"password_hash": 0})  # sin devolver password

def validar_usuario(email: str, password: str):
    usuario = collection.find_one({"email": email})
    if not usuario:
        return False
    return verificar_password(password, usuario["password_hash"])

from fastapi import APIRouter, HTTPException
from repo.usuarios_repo import crear_usuario, validar_usuario, obtener_usuario_por_email

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

@router.post("/registro")
async def registro(usuario: dict):
    try:
        user_id = crear_usuario(usuario)
        return {"mensaje": "Usuario creado con éxito", "id": user_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
async def login(datos: dict):
    email = datos.get("email")
    password = datos.get("password")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email y contraseña son requeridos")

    if validar_usuario(email, password):
        usuario_info = obtener_usuario_por_email(email)
        if not usuario_info:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        usuario_info["_id"] = str(usuario_info["_id"])
        return {
            "mensaje": "Login exitoso",
            "usuario": {
                "id": usuario_info["_id"],
                "nombre": usuario_info.get("nombre"),
                "email": usuario_info.get("email"),
                "rol": usuario_info.get("rol")
            }
        }
    else:
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")

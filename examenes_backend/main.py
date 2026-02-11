from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importa tus routers
from routers.usuarios import router as usuarios_router
from routers.rubricas import router as rubricas_router
from routers.examenes import router as examenes_router
from routers.examenes_temporales import router as examenes_temporales_router

app = FastAPI()

# Configura CORS, adaptando orígenes según tu frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Cambiar por dominios reales en producción
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registra routers con su respectivo prefijo y tags (ya definidos en cada router)
app.include_router(usuarios_router)
app.include_router(rubricas_router)
app.include_router(examenes_router)
app.include_router(examenes_temporales_router)



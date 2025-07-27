from rest_framework.views import APIView
from django.contrib.auth.models import User
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets, permissions
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Q

from .models import Empresa, Faena, Ubicacion, Vehiculo, Herramienta, Tarea, Perfil
from .serializers import (
    EmpresaSerializer, FaenaSerializer, UbicacionSerializer,
    VehiculoSerializer, HerramientaSerializer, TareaSerializer, UserSerializer
)

class EmpresaViewSet(viewsets.ModelViewSet):
    queryset = Empresa.objects.all()
    serializer_class = EmpresaSerializer
    permission_classes = [permissions.IsAuthenticated]

class FaenaViewSet(viewsets.ModelViewSet):
    queryset = Faena.objects.all()
    serializer_class = FaenaSerializer
    permission_classes = [permissions.IsAuthenticated]

class UbicacionViewSet(viewsets.ModelViewSet):
    queryset = Ubicacion.objects.all()
    serializer_class = UbicacionSerializer
    permission_classes = [permissions.IsAuthenticated]

class VehiculoViewSet(viewsets.ModelViewSet):
    queryset = Vehiculo.objects.all()  # <--- AGREGA ESTA LÍNEA
    serializer_class = VehiculoSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        empresa_id = self.request.query_params.get("empresa_id")
        faena_id = self.request.query_params.get("faena_id")
        qs = Vehiculo.objects.all()
        if empresa_id:
            qs = qs.filter(empresa_id=empresa_id)
        if faena_id:
            qs = qs.filter(faena_id=faena_id)
        return qs

class HerramientaViewSet(viewsets.ModelViewSet):
    queryset = Herramienta.objects.all()  # <--- AGREGA ESTA LÍNEA
    serializer_class = HerramientaSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        empresa_id = self.request.query_params.get("empresa_id")
        faena_id = self.request.query_params.get("faena_id")
        qs = Herramienta.objects.all()
        if empresa_id:
            qs = qs.filter(empresa_id=empresa_id)
        if faena_id:
            qs = qs.filter(faena_id=faena_id)
        return qs

class TareaViewSet(viewsets.ModelViewSet):
    queryset = Tarea.objects.all()
    serializer_class = TareaSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Tarea.objects.all().order_by('-fecha_inicio')
        try:
            perfil = user.perfil
        except Perfil.DoesNotExist:
            return Tarea.objects.none()
        if perfil.rol == 'ADMIN' and perfil.faena is None:
            return Tarea.objects.filter(
                empresa=perfil.empresa
            ).order_by('-fecha_inicio')
        if perfil.rol == 'ADMIN' and perfil.faena is not None:
            return Tarea.objects.filter(
                empresa=perfil.empresa,
                faena=perfil.faena
            ).order_by('-fecha_inicio')
        if perfil.rol == 'OPERADOR':
            return Tarea.objects.filter(operador=user).order_by('-fecha_inicio')
        return Tarea.objects.none()

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        empresa_id = self.request.query_params.get('empresa_id')
        faena_id = self.request.query_params.get('faena_id')
        if user.is_superuser:
            qs = User.objects.all()
            if empresa_id:
                qs = qs.filter(perfil__empresa_id=empresa_id)
            if faena_id:
                qs = qs.filter(perfil__faena_id=faena_id)
            return qs.order_by('first_name', 'last_name').distinct()
        try:
            perfil = user.perfil
        except Perfil.DoesNotExist:
            return User.objects.none()
        if perfil.rol == 'ADMIN' and perfil.faena is None:
            qs = User.objects.filter(perfil__empresa=perfil.empresa)
            if faena_id:
                qs = qs.filter(perfil__faena_id=faena_id)
            return qs.order_by('first_name', 'last_name').distinct()
        if perfil.rol == 'ADMIN' and perfil.faena is not None:
            return User.objects.filter(
                perfil__empresa=perfil.empresa,
                perfil__faena=perfil.faena
            ).order_by('first_name', 'last_name').distinct()
        if perfil.rol == 'OPERADOR':
            return User.objects.filter(id=user.id)
        return User.objects.none()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)




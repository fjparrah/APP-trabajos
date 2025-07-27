from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Empresa, Faena, Ubicacion, Vehiculo, Herramienta, Tarea, Perfil

class EmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empresa
        fields = '__all__'

class FaenaSerializer(serializers.ModelSerializer):
    empresa = serializers.PrimaryKeyRelatedField(queryset=Empresa.objects.all())
    class Meta:
        model = Faena
        fields = '__all__'

class UbicacionSerializer(serializers.ModelSerializer):
    faena = FaenaSerializer(read_only=True)
    faena_id = serializers.PrimaryKeyRelatedField(queryset=Faena.objects.all(), source='faena', write_only=True, required=False)
    class Meta:
        model = Ubicacion
        fields = ['id', 'nombre', 'latitud', 'longitud', 'faena', 'faena_id']

class VehiculoSerializer(serializers.ModelSerializer):
    nombre = serializers.SerializerMethodField()
    faena = FaenaSerializer(read_only=True)
    faena_id = serializers.PrimaryKeyRelatedField(queryset=Faena.objects.all(), source='faena', write_only=True, required=False)

    class Meta:
        model = Vehiculo
        fields = ['id', 'empresa', 'faena', 'faena_id', 'patente', 'descripcion', 'nombre']

    def get_nombre(self, obj):
        if obj.descripcion:
            return f"{obj.patente} ({obj.descripcion})"
        return obj.patente

class HerramientaSerializer(serializers.ModelSerializer):
    faena = FaenaSerializer(read_only=True)
    faena_id = serializers.PrimaryKeyRelatedField(queryset=Faena.objects.all(), source='faena', write_only=True, required=False)
    class Meta:
        model = Herramienta
        fields = ['id', 'empresa', 'faena', 'faena_id', 'nombre']

class PerfilSerializer(serializers.ModelSerializer):
    empresa = EmpresaSerializer(read_only=True)
    faena = FaenaSerializer(read_only=True)
    class Meta:
        model = Perfil
        fields = ['id', 'empresa', 'faena', 'rol']

class UserSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.SerializerMethodField()
    perfil = PerfilSerializer(read_only=True)
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'nombre_completo', 'perfil']
    def get_nombre_completo(self, obj):
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        return full_name if full_name else obj.username

class TareaSerializer(serializers.ModelSerializer):
    empresa = EmpresaSerializer(read_only=True)
    faena = FaenaSerializer(read_only=True)
    ubicacion = UbicacionSerializer(read_only=True)
    operador = UserSerializer(read_only=True)
    personas_involucradas = UserSerializer(many=True, read_only=True)
    vehiculos = VehiculoSerializer(many=True, read_only=True)
    herramientas = HerramientaSerializer(many=True, read_only=True)

    empresa_id = serializers.PrimaryKeyRelatedField(queryset=Empresa.objects.all(), write_only=True, source='empresa')
    faena_id = serializers.PrimaryKeyRelatedField(queryset=Faena.objects.all(), write_only=True, source='faena')
    ubicacion_id = serializers.PrimaryKeyRelatedField(queryset=Ubicacion.objects.all(), write_only=True, source='ubicacion')
    operador_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), write_only=True, source='operador')
    personas_involucradas_ids = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), many=True, write_only=True, source='personas_involucradas')
    vehiculos_ids = serializers.PrimaryKeyRelatedField(queryset=Vehiculo.objects.all(), many=True, write_only=True, source='vehiculos')
    herramientas_ids = serializers.PrimaryKeyRelatedField(queryset=Herramienta.objects.all(), many=True, write_only=True, source='herramientas')

    class Meta:
        model = Tarea
        fields = [
            'id', 'descripcion', 'estado', 'fecha_inicio', 'fecha_fin', 'observaciones', 'foto_inicio', 'foto_fin', 'duracion_minutos',
            'empresa', 'faena', 'ubicacion', 'operador', 'personas_involucradas', 'vehiculos', 'herramientas',
            'empresa_id', 'faena_id', 'ubicacion_id', 'operador_id', 'personas_involucradas_ids', 'vehiculos_ids', 'herramientas_ids',
        ]

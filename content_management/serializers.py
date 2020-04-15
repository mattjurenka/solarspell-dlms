from rest_framework import serializers
from content_management.models import (
    Content, Metadata, MetadataType,
    LibraryVersion, LibraryFolder, LibLayoutImage)


class ContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Content
        fields = '__all__'


class MetadataSerializer(serializers.ModelSerializer):
    class Meta:
        model = Metadata
        fields = '__all__'


class MetadataTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetadataType
        fields = '__all__'


class LibLayoutImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = LibLayoutImage
        fields = '__all__'


class LibraryVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = LibraryVersion
        fields = '__all__'


class LibraryFolderSerializer(serializers.ModelSerializer):
    class Meta:
        model = LibraryFolder
        fields = '__all__'


class MetadataTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetadataType
        fields = '__all__'

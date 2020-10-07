from rest_framework.serializers import ModelSerializer
from content_management.models import (
    Content, Metadata, MetadataType, User,
    LibraryVersion, LibraryFolder, LibLayoutImage)

class ContentSerializer(ModelSerializer):
    class Meta:
        model = Content
        fields = ('id', 'file_name', 'content_file', 'title', 'description', 'modified_on', 'copyright',
        'rights_statement', 'published_date', 'active', 'metadata', 'metadata_info', "published_year",
        "file_name", "filesize", "reviewed_on", 'duplicatable')


class MetadataSerializer(ModelSerializer):
    class Meta:
        model = Metadata
        fields = ('id', 'name', 'type', 'type_name')


class MetadataTypeSerializer(ModelSerializer):
    class Meta:
        model = MetadataType
        fields = '__all__'


class LibLayoutImageSerializer(ModelSerializer):
    class Meta:
        model = LibLayoutImage
        fields = ("id", "image_file", "image_group", "file_name")


class LibraryVersionSerializer(ModelSerializer):
    class Meta:
        model = LibraryVersion
        fields = ("id", "library_name", "version_number", "created_on",
        "library_banner", "created_by", "user_info")


class LibraryFolderSerializer(ModelSerializer):
    class Meta:
        model = LibraryFolder
        fields = '__all__'

class UserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'
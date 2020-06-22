from rest_framework import serializers
from content_management.models import (
    Content, Metadata, MetadataType,
    LibraryVersion, LibraryFolder, LibLayoutImage)


class ContentSerializer(serializers.ModelSerializer):
    published_year = serializers.SerializerMethodField('get_published_year')

    def get_published_year(self, content):
        date = content.published_date
        return None if date == None else str(date.year)

    class Meta:
        model = Content
        fields = ('id', 'file_name', 'content_file', 'title', 'description', 'modified_on', 'copyright',
        'rights_statement', 'published_date', 'active', 'metadata', 'metadata_info', "published_year")


class MetadataSerializer(serializers.ModelSerializer):
    class Meta:
        model = Metadata
        fields = ('id', 'name', 'type', 'type_name')


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

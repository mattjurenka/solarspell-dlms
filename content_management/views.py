from rest_framework import viewsets, permissions, views
from rest_framework import status
from rest_framework.response import Response
from content_management.models import (
    Content, Metadata, MetadataType, LibLayoutImage, LibraryVersion, LibraryFolder)
from content_management.utils import ContentSheetUtil, LibraryBuildUtil

from content_management.serializers import ContentSerializer, MetadataSerializer, MetadataTypeSerializer, \
    LibLayoutImageSerializer, LibraryVersionSerializer, LibraryFolderSerializer


# Content ViewSet
class ContentViewSet(viewsets.ModelViewSet):
    queryset = Content.objects.all()
    serializer_class = ContentSerializer


class MetadataViewSet(viewsets.ModelViewSet):
    queryset = Metadata.objects.all()
    serializer_class = MetadataSerializer


class MetadataTypeViewSet(viewsets.ModelViewSet):
    queryset = MetadataType.objects.all()
    serializer_class = MetadataTypeSerializer


class LibLayoutImageViewSet(viewsets.ModelViewSet):
    queryset = LibLayoutImage.objects.all()
    serializer_class = LibLayoutImageSerializer


class LibraryVersionViewSet(viewsets.ModelViewSet):
    queryset = LibraryVersion.objects.all()
    serializer_class = LibraryVersionSerializer


class LibraryFolderViewSet(viewsets.ModelViewSet):
    queryset = LibraryFolder.objects.all()
    serializer_class = LibraryFolderSerializer


class ContentSheetView(views.APIView):

    def post(self, request):
        sheet_util = ContentSheetUtil()
        content_data = request.data
        result = sheet_util.upload_sheet_contents(content_data)
        response = Response(result, status=status.HTTP_200_OK)
        return response


class LibraryBuildView(views.APIView):

    def get(self, request, *args, **kwargs):
        version_id = int(kwargs['version_id'])
        build_util = LibraryBuildUtil()
        result = build_util.build_library(version_id)
        response = Response(result, status=status.HTTP_200_OK)
        return response

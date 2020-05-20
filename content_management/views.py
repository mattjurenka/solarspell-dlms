from rest_framework import viewsets, permissions, views
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action
from content_management.models import (
    Content, Metadata, MetadataType, LibLayoutImage, LibraryVersion, LibraryFolder)
from content_management.utils import ContentSheetUtil, LibraryBuildUtil

from content_management.serializers import ContentSerializer, MetadataSerializer, MetadataTypeSerializer, \
    LibLayoutImageSerializer, LibraryVersionSerializer, LibraryFolderSerializer

from content_management.utils import build_response
from content_management.paginators import PageNumberSizePagination


class StandardDataView:

    def retrieve(self, request, *args, **kwargs):
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return build_response(serializer.data)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return build_response(serializer.data)


# Content ViewSet
class ContentViewSet(StandardDataView, viewsets.ModelViewSet):
    queryset = Content.objects.all()
    serializer_class = ContentSerializer
    pagination_class = PageNumberSizePagination


class MetadataViewSet(StandardDataView, viewsets.ModelViewSet):
    queryset = Metadata.objects.all()
    serializer_class = MetadataSerializer

    @action(methods=['get'], detail=True)
    def get(self, request, pk=None):
        queryset = self.filter_queryset(Metadata.objects.filter(type__name=pk))

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return build_response(serializer.data)

class MetadataTypeViewSet(StandardDataView, viewsets.ModelViewSet):
    queryset = MetadataType.objects.all()
    serializer_class = MetadataTypeSerializer


class LibLayoutImageViewSet(StandardDataView, viewsets.ModelViewSet):
    queryset = LibLayoutImage.objects.all()
    serializer_class = LibLayoutImageSerializer


class LibraryVersionViewSet(StandardDataView, viewsets.ModelViewSet):
    queryset = LibraryVersion.objects.all()
    serializer_class = LibraryVersionSerializer


class LibraryFolderViewSet(StandardDataView, viewsets.ModelViewSet):
    queryset = LibraryFolder.objects.all()
    serializer_class = LibraryFolderSerializer


class ContentSheetView(views.APIView):

    def post(self, request):
        sheet_util = ContentSheetUtil()
        content_data = request.data
        result = sheet_util.upload_sheet_contents(content_data)
        response = build_response(result)
        return response


class LibraryBuildView(views.APIView):

    def get(self, request, *args, **kwargs):
        version_id = int(kwargs['version_id'])
        build_util = LibraryBuildUtil()
        result = build_util.build_library(version_id)
        response = build_response(result)
        return response

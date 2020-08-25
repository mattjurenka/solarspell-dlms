from rest_framework import viewsets, permissions, views
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action
from content_management.models import (
    Content, Metadata, MetadataType, LibLayoutImage, LibraryVersion,
    LibraryFolder, User
    )
from content_management.utils import ContentSheetUtil, LibraryBuildUtil

from content_management.serializers import ContentSerializer, MetadataSerializer, MetadataTypeSerializer, \
    LibLayoutImageSerializer, LibraryVersionSerializer, LibraryFolderSerializer, UserSerializer

from content_management.standardize_format import build_response
from content_management.paginators import PageNumberSizePagination

from django.http import HttpResponse

import csv

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

    def get_queryset(self):
        queryset = self.queryset

        title = self.request.GET.get("title", None)
        if title is not None:
            queryset = queryset.filter(title__icontains=title)
        
        file_name = self.request.GET.get("file_name", None)
        if file_name is not None:
            queryset = queryset.filter(file_name__icontains=file_name)
        
        copyright = self.request.GET.get("copyright", None)
        if copyright is not None:
            queryset = queryset.filter(copyright__icontains=copyright)
        
        active_raw = self.request.GET.get("active", None)
        if active_raw is not None:
            active = active_raw.lower() == "true"
            queryset = queryset.filter(active=active)
        
        metadata_raw = self.request.GET.get("metadata", None)
        if metadata_raw is not None:
            try:
                metadata = [int(x) for x in metadata_raw.split(",")]
                for meta_id in metadata:
                    print(queryset)
                    queryset = queryset.filter(metadata__in=[meta_id])
                    print(queryset)
            except Exception as e:
                print(e)

        year_from_raw = self.request.GET.get("published_year_from", None)
        if year_from_raw is not None:
            try:
                year = int(year_from_raw)
                queryset = queryset.filter(published_date__year__gte=(year))
            except:
                pass

        year_to_raw = self.request.GET.get("published_year_to", None)
        if year_to_raw is not None:
            try:
                year = int(year_to_raw)
                queryset = queryset.filter(published_date__year__lte=(year))
            except:
                pass
        
        filesize_from_raw = self.request.GET.get("filesize_from", None)
        if filesize_from_raw is not None:
            try:
                filesize = int(filesize_from_raw)
                queryset = queryset.filter(filesize__gte=(filesize))
            except:
                pass

        filesize_to_raw = self.request.GET.get("filesize_to", None)
        if filesize_to_raw is not None:
            try:
                filesize = int(filesize_to_raw)
                queryset = queryset.filter(filesize__lte=(filesize))
            except:
                pass
        
        reviewed_from_raw = self.request.GET.get("reviewed_from", None)
        if reviewed_from_raw is not None:
            try:
                queryset = queryset.filter(reviewed_on__gte=(reviewed_from_raw))
            except:
                pass

        reviewed_to_raw = self.request.GET.get("reviewed_to", None)
        if reviewed_to_raw is not None:
            try:
                queryset = queryset.filter(reviewed_on__lte=(reviewed_to_raw))
            except:
                pass

        order_raw = self.request.GET.get("sort", None)
        if order_raw is not None:
            try:
                split = order_raw.split(",")
                order_str = ("-" if split[1] == "desc" else "") + split[0]
                queryset = queryset.order_by(order_str)
            except:
                pass

        return queryset


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

class UserViewSet(StandardDataView, viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class LibraryVersionViewSet(StandardDataView, viewsets.ModelViewSet):
    queryset = LibraryVersion.objects.all()
    serializer_class = LibraryVersionSerializer
    folder_serializer = LibraryFolderSerializer

    @action(methods=['get'], detail=True)
    def root(self, request, pk=None):
        return build_response(LibraryFolderSerializer(
                LibraryFolder.objects.filter(version=pk, parent=None).order_by("id"),
                many=True
            ).data if pk is not None else []
        )



class LibraryFolderViewSet(StandardDataView, viewsets.ModelViewSet):
    queryset = LibraryFolder.objects.all()
    serializer_class = LibraryFolderSerializer

    @action(methods=['get'], detail=True)
    def contents(self, request, pk=None):
        if pk is None:
            return build_response(
                status=status.HTTP_400_BAD_REQUEST,
                success=False,
                error="No Folder ID supplied"
                )
        else:
            return build_response(
                {
                    "folders": self.get_serializer(
                        self.get_queryset().filter(parent=pk).order_by("id"),
                        many=True
                    ).data,
                    "files": ContentSerializer(
                        self.get_queryset().get(id=pk).library_content,
                        many=True
                    ).data
                }
            )

class BulkAddView(views.APIView):

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

def metadata_sheet(request, metadata_type):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="{}.csv"'.format(metadata_type)
    
    writer = csv.writer(response)
    writer.writerow([metadata_type])

    for metadata in Metadata.objects.all().filter(type__name=metadata_type):
        writer.writerow([metadata.name])
    
    return response
from rest_framework import viewsets, permissions, views
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, renderer_classes
from content_management.models import (
    Content, Metadata, MetadataType, LibLayoutImage, LibraryVersion,
    LibraryFolder, User,
    LibraryModule)
from content_management.utils import ContentSheetUtil, LibraryBuildUtil

from content_management.serializers import ContentSerializer, MetadataSerializer, MetadataTypeSerializer, \
    LibLayoutImageSerializer, LibraryVersionSerializer, LibraryFolderSerializer, UserSerializer, LibraryModuleSerializer

from content_management.standardize_format import build_response
from content_management.paginators import PageNumberSizePagination

from django.db.models import Q

from django.http import HttpResponse

import csv
from rest_framework.generics import get_object_or_404
from rest_framework.renderers import JSONRenderer


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
            if active_raw.lower() == "true":
                queryset = queryset.filter(active=True)
            if active_raw.lower() == "false":
                queryset = queryset.filter(active=False)

        duplicated_raw = self.request.GET.get("duplicatable", None)
        if duplicated_raw is not None:
            if duplicated_raw.lower() == "true":
                queryset = queryset.filter(duplicatable=True)
            if duplicated_raw.lower() == "false":
                queryset = queryset.filter(duplicatable=False)
        
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
        
        exclude_version = self.request.GET.get("exclude_in_version", None)
        if exclude_version is not None:
            try:
                content_in_version = LibraryFolder.objects.filter(version_id=exclude_version).values_list('library_content', flat=True)
                id_list = list(content_in_version)
                filtered = filter(lambda id: id != None, id_list)
                if filtered != []:
                    queryset = queryset.filter(Q(duplicatable=True) | ~Q(id__in=filtered))
            except Exception as e:
                print(e)

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
    
    @action(methods=['get'], detail=True)
    def folders(self, request, pk=None):
        return build_response(LibraryFolderSerializer(
            LibraryFolder.objects.filter(version=pk).order_by("id"),
            many=True
        ).data if pk is not None else []
                              )

    @action(methods=['get'], detail=True)
    def modules(self, request, pk=None):
        return build_response(LibraryModuleSerializer(
            LibraryVersion.objects.get(id=pk).library_modules.all(),
            many=True
        ).data if pk is not None and pk is not '0' else []
                              )

    @action(methods=['post'], detail=True)
    def addmodule(self, request, pk=None):
        if pk is None:
            return build_response(
                status=status.HTTP_400_BAD_REQUEST,
                success=False,
                error="No Version ID supplied"
            )
        library_module_id = request.data.get("library_module_id", None)
        if library_module_id is None:
            return build_response(
                status=status.HTTP_400_BAD_REQUEST,
                success=False,
                error="No Module ID supplied"
            )
        version = self.get_queryset().get(id=pk)
        version.library_modules.add(
            LibraryModule.objects.get(id=library_module_id)
        )
        return build_response()

    @action(methods=['post'], detail=True)
    def removemodule(self, request, pk=None):
        if pk is None:
            return build_response(
                status=status.HTTP_400_BAD_REQUEST,
                success=False,
                error="No Version ID supplied"
            )
        library_module_id = request.data.get("library_module_id", None)
        if library_module_id is None:
            return build_response(
                status=status.HTTP_400_BAD_REQUEST,
                success=False,
                error="No Module ID supplied"
            )
        version = self.get_queryset().get(id=pk)
        version.library_modules.remove(
            LibraryModule.objects.get(id=library_module_id)
        )
        return build_response()

    @action(methods=['get'], detail=True)
    def clone(self, request, pk=None):
        if pk is None:
            return build_response(
                status=status.HTTP_400_BAD_REQUEST,
                success=False,
                error="No Folder ID supplied"
                )
        
        version_to_clone = get_object_or_404(LibraryVersion, id=pk)

        #clone version
        version_to_clone.id = None
        version_to_clone.library_name = "(CLONED) " +  version_to_clone.library_name
        version_to_clone.save()

        def clone_recursively(folder_to_clone, new_parent):
            #save relationships of the old folder
            subfolders = folder_to_clone.subfolders.all()
            library_content = folder_to_clone.library_content.all()
            
            #clone subfolder
            folder_to_clone.id = None
            folder_to_clone.save()
            folder_to_clone.parent = new_parent
            folder_to_clone.version = version_to_clone
            folder_to_clone.library_content.set(library_content)
            folder_to_clone.save()
            
            for child in subfolders:
                clone_recursively(child, folder_to_clone)
        
        [
            clone_recursively(top_level_folder, None) for top_level_folder
            in LibraryFolder.objects.filter(parent=None, version_id=pk)
        ]

        return build_response(LibraryVersionSerializer(version_to_clone).data)



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
    
    @action(methods=['post'], detail=True)
    def addcontent(self, request, pk=None):
        if pk is None:
            return build_response(
                status=status.HTTP_400_BAD_REQUEST,
                success=False,
                error="No Folder ID supplied"
            )
        content_ids = request.data.get("content_ids", None) 
        if content_ids is None:
            return build_response(
                status=status.HTTP_400_BAD_REQUEST,
                success=False,
                error="No Content ID supplied"
            )
        
        folder = self.get_queryset().get(id=pk)
        for content_id in content_ids:
            folder.library_content.add(
                Content.objects.get(id=content_id)
            )

        return build_response()
    
    @action(methods=['post'], detail=True)
    def removecontent(self, request, pk=None):
        if pk is None:
            return build_response(
                status=status.HTTP_400_BAD_REQUEST,
                success=False,
                error="No Folder ID supplied"
            )
        
        content_ids = request.data.get("content_ids", None) 
        if content_ids is None:
            return build_response(
                status=status.HTTP_400_BAD_REQUEST,
                success=False,
                error="No Content ID supplied"
            )
        
        folder = self.get_queryset().get(id=pk)
        for content_id in content_ids:
            folder.library_content.remove(
                Content.objects.get(id=content_id)
            )

        return build_response()


class LibraryModuleViewSet(StandardDataView, viewsets.ModelViewSet):
    queryset = LibraryModule.objects.all()
    serializer_class = LibraryModuleSerializer


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

@api_view(('GET',))
@renderer_classes((JSONRenderer,))
def disk_info(request):
    import shutil
    total, used, free = shutil.disk_usage('/')
    return build_response({
        "total": total,
        "used": used,
        "free": free
    })
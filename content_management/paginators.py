from rest_framework.pagination import PageNumberPagination
from content_management.utils import build_response

class PageNumberSizePagination(PageNumberPagination):
    page_size = "10"
    page_size_query_param = "size"
    page_query_param = "page"

    def get_paginated_response(self, data):
        return build_response({
            "results": data,
            "count": self.page.paginator.count
        })

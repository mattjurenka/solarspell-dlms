from rest_framework.views import exception_handler
from rest_framework import status
from rest_framework.response import Response
from typing import Any, Literal


def standard_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        response.data = {
            'data': None,
            'error': getattr(response, "data", ""),
            'success': False
        }
    return response


def build_response(data: Any=None, status: int=status.HTTP_200_OK, success: bool=True, error: Any=None) -> Response: 
    """
    Builds a standardized JSON response given data and a success flag
    If success is false also takes an error
    """
    return Response({
        "success": success,
        "data": data,
        "error": error
    }, status)

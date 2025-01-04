from rest_framework.views import APIView
from rest_framework.response import Response
import requests

class IPInfoView(APIView):
    def get(self, request):
        search_ip = request.GET.get('ip', None)
        client_ip = search_ip if search_ip else request.META.get('REMOTE_ADDR')
        
        try:
            response = requests.get(f'http://ip-api.com/json/{client_ip}')
            if response.status_code == 200:
                data = response.json()
                if data['status'] == 'success':
                    return Response(data)
            return Response({'error': 'IP info not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)
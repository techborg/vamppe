// Default base URL — overridden at runtime via ServerConfig
const String defaultBaseUrl = 'http://172.19.186.43:5000';

// These are set at runtime by ServerConfig.init()
String baseUrl = defaultBaseUrl;
String apiUrl  = '$defaultBaseUrl/api';

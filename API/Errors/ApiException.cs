namespace API.Errors
{
      public class ApiException
      {
            
            public ApiException(int statusCode,string message, string details)
            {
                  this.StatusCode = statusCode;
                  this.Details = details;
                  this.Message = message;
            }
            
            public int StatusCode { get; set; }
            public string Message { get; set; }
            public string Details { get; set; }
      }
}
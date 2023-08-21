
using API.Data;
using API.Interfaces;
using API.Services;
using Microsoft.EntityFrameworkCore;

namespace API.Extensions
{
      public static class ApplicationServiceExtensions
      {
            public static IServiceCollection AddApplicationService(this IServiceCollection services, IConfiguration config)
            {
                  services.AddEndpointsApiExplorer();
                  services.AddSwaggerGen();
                  services.AddDbContext<DataContext>(opt =>
                  {
                        opt.UseSqlite(config.GetConnectionString("DefaultConnection"));
                  });
                  services.AddCors();
                  services.AddScoped<ITokenService, TokenService>();

                  return services;
            }
      }
}
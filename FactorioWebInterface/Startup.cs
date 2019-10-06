using FactorioWebInterface.Data;
using FactorioWebInterface.Hubs;
using FactorioWebInterface.Models;
using FactorioWebInterface.Services;
using FactorioWebInterface.Utils.ProcessAbstractions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Microsoft.VisualStudio.Web.CodeGeneration;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.IO.Abstractions;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace FactorioWebInterface
{
    public class Startup
    {
        private readonly SymmetricSecurityKey SecurityKey;
        private readonly JwtSecurityTokenHandler JwtTokenHandler = new JwtSecurityTokenHandler();

        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;

            // This is the key used to sign JwtBearer tokens.
            var data = Encoding.ASCII.GetBytes(configuration[Constants.SecurityKey]);
            SecurityKey = new SymmetricSecurityKey(data);
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddDbContextPool<ApplicationDbContext>(options => options.UseSqlite("Data Source=FactorioWebInterface.db"));

            services.AddDbContextPool<ScenarioDbContext>(options => options.UseSqlite("Data Source=Scenario.db"));

            services.AddSingleton<IDbContextFactory, DbContextFactory>();

            services.AddIdentity<ApplicationUser, IdentityRole>()
                .AddEntityFrameworkStores<ApplicationDbContext>();

            services.Configure<IdentityOptions>(options =>
            {
                // Password settings.
                options.Password.RequireDigit = false;
                options.Password.RequireLowercase = false;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequireUppercase = false;
                options.Password.RequiredLength = 6;
                options.Password.RequiredUniqueChars = 1;

                // Lockout settings.
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.AllowedForNewUsers = true;

                StringBuilder sb = new StringBuilder();
                for (int i = 32; i < ushort.MaxValue; i++)
                {
                    sb.Append((char)i);
                }
                string set = sb.ToString();

                // User settings.
                options.User.AllowedUserNameCharacters = set;
                //"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._@+()[]{}"; // Todo Find out all allowed characters for discord username.
                options.User.RequireUniqueEmail = false;
            });

            services.Configure<SecurityStampValidatorOptions>(options =>
            {
                // enables immediate logout, after updating the user's stat.
                options.ValidationInterval = TimeSpan.Zero;
            });

            //services.ConfigureApplicationCookie(options => options.LoginPath = "");

            services.AddHttpClient();

            services.AddMemoryCache();

            services.AddSingleton<System.IO.Abstractions.IFileSystem, FileSystem>();
            services.AddSingleton<IProcessSystem, ProcessSystem>();
            services.AddSingleton<FactorioServerDataConfiguration>();
            services.AddSingleton<IFactorioServerDataService, FactorioServerDataService>();
            services.AddSingleton<DiscordBotContext, DiscordBotContext>();
            services.AddSingleton<DiscordBot, DiscordBot>();
            services.AddSingleton<FactorioUpdater, FactorioUpdater>();
            services.AddSingleton<IFactorioAdminManager, FactorioAdminManager>();
            services.AddSingleton<IFactorioModManager, FactorioModManager>();
            services.AddSingleton<ScenarioDataManager, ScenarioDataManager>();
            services.AddSingleton<IFactorioBanService, FactorioBanService>();
            services.AddSingleton<IPublicFactorioSaves, PublicFactorioSaves>();
            services.AddSingleton<IFactorioFileManager, FactorioFileManager>();
            services.AddSingleton<IFactorioServerPreparer, FactorioServerPreparer>();
            services.AddSingleton<IFactorioServerRunner, FactorioServerRunner>();
            services.AddSingleton<IFactorioServerManager, FactorioServerManager>();
            services.AddSingleton<BanHubEventHandlerService, BanHubEventHandlerService>();
            services.AddSingleton<FactorioAdminManagerEventHandlerService, FactorioAdminManagerEventHandlerService>();

            services.AddRouting(o => o.LowercaseUrls = true);

            services.AddMvc()
                .SetCompatibilityVersion(CompatibilityVersion.Version_2_2)
                .AddRazorPagesOptions(options =>
                {
                    options.Conventions.AddPageRoute("/admin/servers", "/admin");
                    services.AddAntiforgery(o => o.HeaderName = "XSRF-TOKEN");
                })
                .AddSessionStateTempDataProvider()
                .AddGitHubWebHooks();

            services.AddSession();

            services.Configure<ForwardedHeadersOptions>(options =>
            {
                options.ForwardedHeaders =
                    ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
            });

            services.Configure<FormOptions>(o =>
            {
                o.ValueLengthLimit = int.MaxValue;
                o.MultipartBodyLengthLimit = int.MaxValue;
                //o.MultipartHeadersLengthLimit = int.MaxValue;
            });

            services.AddSignalR()
                .AddMessagePackProtocol();

            // The JwtBearer token is used by the FactorioWrapper process for authentication.
            services.AddAuthorization(options =>
            {
                options.AddPolicy(JwtBearerDefaults.AuthenticationScheme, policy =>
                {
                    policy.AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme);
                    policy.RequireClaim(ClaimTypes.NameIdentifier);
                });
            });

            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters =
                    new TokenValidationParameters
                    {
                        ValidateAudience = false,
                        ValidateIssuer = false,
                        ValidateActor = false,
                        ValidateLifetime = false,
                        IssuerSigningKey = SecurityKey,
                    };

                    options.Events = new JwtBearerEvents
                    {
                        OnMessageReceived = context =>
                        {
                            var accessToken = context.Request.Query["access_token"];

                            if (!string.IsNullOrEmpty(accessToken) &&
                                (context.HttpContext.WebSockets.IsWebSocketRequest || context.Request.Headers["Accept"] == "text/event-stream"))
                            {
                                context.Token = context.Request.Query["access_token"];
                            }
                            return Task.CompletedTask;
                        }
                    };
                });
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            app.UseForwardedHeaders();

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                app.UseDatabaseErrorPage();
                //app.UseBrowserLink(); This prevented the application from running on linux.
            }
            else
            {
                app.UseExceptionHandler("/error");
                //app.UseHsts(); This prevented the GitHub hook from working.
            }

            //app.UseHttpsRedirection(); This isn't needed if behind a reverse proxy.
            app.UseDefaultFiles();
            app.UseStaticFiles();

            app.UseAuthentication();

            app.UseSession();

            app.UseSignalR(routes =>
            {
                routes.MapHub<FactorioControlHub>("/factorioControlHub");
                routes.MapHub<FactorioProcessHub>("/factorioProcessHub");
                routes.MapHub<FactorioAdminHub>("/factorioAdminHub");
                routes.MapHub<ScenarioDataHub>("/scenarioDataHub");
                routes.MapHub<FactorioBanHub>("/factorioBanHub");
                routes.MapHub<PlaguesPlaygroundHub>("/plaguesPlaygroundHub");
                routes.MapHub<FactorioModHub>("/factorioModHub");
            });

            app.UseMvc();
        }

        private string GenerateToken()
        {
            var claims = new[] { new Claim(ClaimTypes.NameIdentifier, Constants.FactorioWrapperClaim) };
            var credentials = new SigningCredentials(SecurityKey, SecurityAlgorithms.HmacSha256);
            var token = new JwtSecurityToken("Server", claims: claims, signingCredentials: credentials);
            return JwtTokenHandler.WriteToken(token);
        }
    }
}

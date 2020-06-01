using FactorioWebInterface.Data;
using FactorioWebInterface.Services.Discord;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;
using System.ComponentModel.DataAnnotations;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace FactorioWebInterface.Pages.Admin
{
    public class SigninModel : PageModel
    {
        private readonly IConfiguration _configuration;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<SigninModel> _logger;
        private readonly IHttpClientFactory _clientFactory;
        private readonly IDiscordService _discordService;

        public SigninModel(
            IConfiguration configuration,
            SignInManager<ApplicationUser> signInManager,
            UserManager<ApplicationUser> userManager,
            ILogger<SigninModel> logger,
            IHttpClientFactory clientFactory,
            IDiscordService discordService)
        {
            _configuration = configuration;
            _signInManager = signInManager;
            _userManager = userManager;
            _logger = logger;
            _clientFactory = clientFactory;
            _discordService = discordService;
        }

        private string RedirectUrl => $"{Request.Scheme}://{Request.Host}/admin/signin";

        [BindProperty]
        public InputModel Input { get; set; } = default!;

        public class InputModel
        {
            [Required]
            public string UserName { get; set; } = default!;

            [Required]
            [DataType(DataType.Password)]
            public string Password { get; set; } = default!;
        }

        private async Task<bool> AllowedToSingIn(ApplicationUser user)
        {
            if (user.Suspended)
            {
                ModelState.AddModelError(string.Empty, "The account has been suspended.");
                return false;
            }

            if (!await _userManager.IsInRoleAsync(user, Constants.AdminRole))
            {
                ModelState.AddModelError(string.Empty, "The account does not have the Admin role.");
                return false;
            }

            return true;
        }

        public async Task<IActionResult> OnGetAsync(string? code)
        {
            if (code == null)
            {
                return Page();
            }

            // We have now been redirected from the discord authorization.

            await _signInManager.SignOutAsync();

            using var client = _clientFactory.CreateClient();
            string clientID = _configuration[Constants.ClientIDKey];
            string clientSecret = _configuration[Constants.ClientSecretKey];

            var tokenRequest = new HttpRequestMessage(HttpMethod.Post, "https://discordapp.com/api/oauth2/token");
            string parameters = $"client_id={clientID}&client_secret={clientSecret}&grant_type=authorization_code&code={code}&redirect_uri={RedirectUrl}";
            tokenRequest.Content = new StringContent(parameters, Encoding.UTF8, "application/x-www-form-urlencoded");

            var tokenResult = await client.SendAsync(tokenRequest);

            if (!tokenResult.IsSuccessStatusCode)
            {
                ModelState.AddModelError(string.Empty, "Discord authorization failed.");
                return Page();
            }

            var content = await tokenResult.Content.ReadAsAsync<JObject>();
            string access_token = content.Value<string>("access_token");

            var userRequest = new HttpRequestMessage(HttpMethod.Get, "https://discordapp.com/api/users/@me");
            userRequest.Headers.Add("Authorization", "Bearer " + access_token);

            var userResult = await client.SendAsync(userRequest);

            if (!userResult.IsSuccessStatusCode)
            {
                ModelState.AddModelError(string.Empty, "Discord authorization failed.");
                return Page();
            }

            var userContent = await userResult.Content.ReadAsAsync<JObject>();
            var userId = userContent.Value<string>("id");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                // If the user doesn't have an account make one, but only if they have the admin role in the Redmew guild.
                var isAdmin = await _discordService.IsAdminRoleAsync(userId);
                if (!isAdmin)
                {
                    ModelState.AddModelError(string.Empty, "Discord authorization failed - not an admin member of the Redmew guild.");
                    return Page();
                }

                user = new ApplicationUser()
                {
                    Id = userId,
                    UserName = userContent.Value<string>("username")
                };
                var result = await _userManager.CreateAsync(user);
                if (!result.Succeeded)
                {
                    foreach (var error in result.Errors)
                        ModelState.AddModelError(string.Empty, error.Description);

                    return Page();
                }

                result = await _userManager.AddToRoleAsync(user, Constants.AdminRole);
                if (!result.Succeeded)
                {
                    foreach (var error in result.Errors)
                        ModelState.AddModelError(string.Empty, error.Description);

                    return Page();
                }
            }
            else if (!await AllowedToSingIn(user))
            {
                return Page();
            }

            await _signInManager.SignInAsync(user, isPersistent: false);
            _logger.LogInformation($"User {user.UserName} signed in using discord.");

            string returnUrl = HttpContext.Session.GetString("returnUrl") ?? "Servers";
            return Redirect(returnUrl);
        }

        public async Task<IActionResult> OnPostAsync()
        {
            await _signInManager.SignOutAsync();

            if (!ModelState.IsValid)
            {
                ModelState.AddModelError(string.Empty, "Invalid login attempt.");
                return Page();
            }

            var user = await _userManager.FindByNameAsync(Input.UserName);

            if (user == null || !await AllowedToSingIn(user))
            {
                ModelState.AddModelError(string.Empty, "Invalid login attempt.");
                return Page();
            }

            var result = await _signInManager.PasswordSignInAsync(Input.UserName, Input.Password, isPersistent: false, lockoutOnFailure: false);
            if (result.Succeeded)
            {
                _logger.LogInformation($"User {user.UserName} signed in using password.");

                string returnUrl = HttpContext.Session.GetString("returnUrl") ?? "servers";

                return Redirect(returnUrl);
            }
            else
            {
                ModelState.AddModelError(string.Empty, "Invalid login attempt.");
                return Page();
            }
        }

        public IActionResult OnPostDiscord()
        {
            string clientID = _configuration[Constants.ClientIDKey];

            Response.Redirect($"https://discordapp.com/api/oauth2/authorize?response_type=code&client_id={clientID}&scope=identify%20guilds.join&redirect_uri={RedirectUrl}");
            return Page();
        }
    }
}
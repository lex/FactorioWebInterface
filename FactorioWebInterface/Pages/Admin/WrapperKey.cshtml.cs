using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using FactorioWebInterface.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace FactorioWebInterface.Pages.Admin
{
    public class WrapperKeyModel : PageModel
    {
        private readonly UserManager<ApplicationUser> _userManger;
        private readonly IConfiguration _configuration;

        public string Key { get; private set; } = "";

        public WrapperKeyModel(UserManager<ApplicationUser> userManger, IConfiguration configuration)
        {
            _userManger = userManger;
            _configuration = configuration;
        }

        public async Task<IActionResult> OnGetAsync()
        {
            var user = await _userManger.GetUserAsync(User);

            if (user == null || user.Suspended)
            {
                HttpContext.Session.SetString("returnUrl", "wrapperKey");
                return RedirectToPage("signIn");
            }

            Key = GenerateToken();

            return Page();
        }

        private string GenerateToken()
        {
            try
            {
                var data = Encoding.ASCII.GetBytes(_configuration[Constants.SecurityKey]);
                var securityKey = new SymmetricSecurityKey(data);
                var jwtTokenHandler = new JwtSecurityTokenHandler();

                var claims = new[] { new Claim(ClaimTypes.NameIdentifier, Constants.FactorioWrapperClaim) };
                var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
                var token = new JwtSecurityToken("Server", claims: claims, signingCredentials: credentials);
                return jwtTokenHandler.WriteToken(token);
            }
            catch (Exception ex)
            {
                return ex.Message;
            }
        }
    }
}

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System;

namespace FactorioWebInterface.Data
{
    public interface IDbContextFactory
    {
        T Create<T>() where T : DbContext;
    }

    // This class exsits becasue it is not advisable to keep local copies to DBContext as the context will get stale.
    // Everytime you want to do something with the databse create a dependency on this class and use Create() once per transcation.
    // https://stackoverflow.com/questions/10585478/one-dbcontext-per-web-request-why
    public class DbContextFactory : IDbContextFactory
    {
        private readonly IServiceProvider _serviceProvider;

        public DbContextFactory(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        public T Create<T>() where T : DbContext
        {
            return _serviceProvider.CreateScope().ServiceProvider.GetService<T>();
        }
    }
}

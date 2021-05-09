using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System;

namespace FactorioWebInterface.Data
{
    public interface IDbContextFactory
    {
        T Create<T>() where T : DbContext;
    }

    // This class exists because it is not advisable to keep local copies to DBContext as the context will get stale.
    // Every time you want to do something with the database create a dependency on this class and use Create() once per transaction.
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
            return _serviceProvider.CreateScope().ServiceProvider.GetRequiredService<T>();
        }
    }
}

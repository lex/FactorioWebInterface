using FactorioWebInterface.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;

namespace FactorioWebInterfaceTests.Utils
{
    public class TestDbContextFactory : IDbContextFactory, IDisposable
    {
        private readonly Dictionary<Type, SqliteConnection> connections = new Dictionary<Type, SqliteConnection>();

        public T Create<T>() where T : DbContext
        {
            bool firstTime = !connections.TryGetValue(typeof(T), out SqliteConnection? connection);
            if (firstTime)
            {
                connection = new SqliteConnection("DataSource=:memory:");
                connection.Open();
                connections.Add(typeof(T), connection);
            }

            var options = new DbContextOptionsBuilder<T>()
                    .UseSqlite(connection)
                    .Options;

            var value = (T)Activator.CreateInstance(typeof(T), options)!;

            if (firstTime)
            {
                value.Database.EnsureCreated();
            }

            return value;
        }

        public void Dispose()
        {
            foreach (var connection in connections.Values)
            {
                connection.Dispose();
            }
        }
    }
}

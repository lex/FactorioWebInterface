using System;

namespace FactorioWebInterface.Models
{
    /// <summary>
    /// Attaches an exmaple usage for the command.
    /// </summary>
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = false, Inherited = true)]
    public class ExampleAttribute : Attribute
    {
        public string Text { get; }

        public ExampleAttribute(string text)
        {
            Text = text;
        }
    }
}

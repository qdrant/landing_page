try
{
    foreach (var arg in args)
    {
        switch (arg)
        {
            // %cases%
            default:
                Console.WriteLine($"Unknown argument: {arg}");
                Environment.Exit(1);
                break;
        }
    }
}
catch (Exception e)
{
    Console.Error.WriteLine($"Error occurred: {e.Message}");
    Console.Error.WriteLine(e.StackTrace);
    Environment.Exit(1);
}

await Task.CompletedTask;

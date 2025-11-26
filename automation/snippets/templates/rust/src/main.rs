// %mods%

#[tokio::main]
async fn main() {
    for arg in std::env::args().skip(1) {
        match arg.as_str() {
            // %cases%
            _ => {
                eprintln!("Unknown argument: {}", arg);
                std::process::exit(1);
            }
        }
    }
}

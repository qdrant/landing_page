let
  rust-overlay = builtins.fetchTarball "https://github.com/oxalica/rust-overlay/archive/master.tar.gz";
  pkgs = import <nixpkgs> { overlays = [ (import rust-overlay) ]; };
in
pkgs.mkShell {
  buildInputs = with pkgs; [
    # for ./sync-clients.py
    git

    # for csharp client
    dotnetCorePackages.sdk_8_0-bin

    # for go client
    go

    # for java client
    openjdk

    # for python client
    uv

    # for rust client
    rust-bin.stable.latest.default

    # for typescript client
    pnpm
  ];
}

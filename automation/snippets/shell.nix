with import <nixpkgs> { };
mkShell {
  buildInputs = [
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
    cargo
    rustfmt

    # for typescript client
    pnpm
  ];
}

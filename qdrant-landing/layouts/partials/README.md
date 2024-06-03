# What to put in the partials directory on the top level (aka here)

Partials not depending on the theme which can be reused even if the theme changes, for example:
- a partial returning only the <head> of a page
- a partial returning only one html element like a link or a image without any class or style
- a partial returning only some logic like a loop or a condition without any html

# What not to put in the partials directory on the top level (aka here)

Partials depending on the theme, for example:
- a partial returning elements with classes or styles
- a partial returning a whole section of a page

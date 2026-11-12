{{- $r := partial "common/products/resolve.html" (dict "products" (.Get 0) "where" (printf "%s: products shortcode" .Page.File.Path)) -}}
<product-specific products="{{ $r.text }}">

{{ trim .Inner "\n" }}

</product-specific>

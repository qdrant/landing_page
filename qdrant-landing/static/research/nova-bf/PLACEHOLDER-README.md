# Image assets for /research/nova-bf/

Drop the real files here, using EXACTLY these names. The post already
references them, so no markdown edits are needed once they land.

| Filename                  | Referenced at            | What it should show                                                                 |
|---------------------------|--------------------------|-------------------------------------------------------------------------------------|
| `hero.png`                | frontmatter (`preview_image`, `social_preview_image`) | Social/preview card image for the post.                          |
| `two-tier-mapreduce.svg`  | end of "Architecture"    | `[image1]` in the draft — the intra-worker / inter-worker map-reduce diagram.        |
| `maxsim-fused-kernel.svg` | end of "Custom Fused Kernels" | `[image2]` in the draft — the MaxSim / fused CUDA kernel diagram.               |

## Notes

- The original `[image1]` and `[image2]` are still embedded as base64 PNGs in the
  draft you pasted. They were not extracted — export them fresh as SVG instead,
  the same way the `supernova-10b` figures were done.
- Export SVG with text converted to paths so labels don't shift:
  `plt.rcParams['svg.fonttype'] = 'path'`
- The blog is light-only (no dark-mode CSS in the theme), so a transparent or
  white background both work.
- Delete this file and the `.placeholder` files once the real assets are in.

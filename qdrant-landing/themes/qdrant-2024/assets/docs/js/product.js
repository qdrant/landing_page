// Product selection for the docs: which product's content is shown in
// full, and which is collapsed or flagged.
//
// The selected product lives on <html data-product="...">. No attribute
// means "All products". This module runs in <head>, so the attribute is
// set before the page paints and CSS does the collapsing without a flash.
//
// Sources, in order: the ?product= URL parameter (not persisted), then
// localStorage. Choosing a product in the selector saves it and drops the
// URL parameter.
import * as params from '@params';

const STORAGE_KEY = 'preferred-product';
const PARAM = 'product';
const PRODUCTS = (params.products || []).map((p) => p.key);

function load() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    return null;
  }
}

function save(product) {
  try {
    if (product) localStorage.setItem(STORAGE_KEY, product);
    else localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    /* storage unavailable */
  }
}

function valid(product) {
  return PRODUCTS.includes(product) ? product : null;
}

function initialState() {
  const fromUrl = valid(new URLSearchParams(window.location.search).get(PARAM));
  if (fromUrl) return { product: fromUrl, source: 'url' };
  const stored = valid(load());
  if (stored) return { product: stored, source: 'storage' };
  return { product: null, source: null };
}

function apply(product, source) {
  const root = document.documentElement;
  if (product) {
    root.setAttribute('data-product', product);
    root.setAttribute('data-product-source', source);
  } else {
    root.removeAttribute('data-product');
    root.removeAttribute('data-product-source');
  }
}

export function currentProduct() {
  return document.documentElement.getAttribute('data-product');
}

function syncSelectors() {
  const product = currentProduct() || '';
  document.querySelectorAll('.product-selector').forEach((select) => {
    select.value = product;
  });
}

function setOpen(scoped, open) {
  scoped.classList.toggle('is-open', open);
  const toggle = scoped.querySelector(':scope > .product-scoped__note .product-scoped__toggle');
  if (toggle) {
    toggle.setAttribute('aria-expanded', String(open));
  }
}

function selectProduct(product) {
  save(product);
  const url = new URL(window.location.href);
  if (url.searchParams.has(PARAM)) {
    url.searchParams.delete(PARAM);
    history.replaceState(history.state, '', url);
  }
  apply(product, product ? 'storage' : null);
  document.querySelectorAll('.product-scoped.is-open').forEach((el) => setOpen(el, false));
  syncSelectors();
  document.dispatchEvent(new CustomEvent('product:change', { detail: { product, persist: true } }));
}

const initial = initialState();
apply(initial.product, initial.source);

document.addEventListener('DOMContentLoaded', () => {
  syncSelectors();

  document.querySelectorAll('.product-selector').forEach((select) => {
    select.addEventListener('change', () => selectProduct(select.value || null));
  });

  document.querySelectorAll('.product-scoped__toggle').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const scoped = toggle.closest('.product-scoped');
      setOpen(scoped, !scoped.classList.contains('is-open'));
    });
  });
});

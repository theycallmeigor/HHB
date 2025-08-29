class SubscriptionToggle extends HTMLElement {
  constructor() {
    super();
    this.checkbox = this.querySelector('input[type="checkbox"]');
    this.sectionId = this.dataset.section;
    this.regularProductId = this.dataset.regularProduct;
    this.subscriptionProductId = this.dataset.subscriptionProduct;
    this.regularHandle = this.dataset.regularHandle;
    this.subscriptionHandle = this.dataset.subscriptionHandle;
    
    this.productData = JSON.parse(this.querySelector('.subscription-products-data').textContent);
    
    this.init();
  }
  
  init() {
    if (!this.checkbox) return;
    
    this.checkbox.addEventListener('change', this.handleToggle.bind(this));
    
    // Check initial state
    if (this.checkbox.checked) {
      this.switchToSubscription();
    }
  }
  
  handleToggle(event) {
    const isChecked = event.target.checked;
    
    if (isChecked) {
      this.switchToSubscription();
    } else {
      this.switchToRegular();
    }
  }
  
  switchToSubscription() {
    this.updateProduct(this.productData.subscription);
    this.updateURL(this.subscriptionHandle);
  }
  
  switchToRegular() {
    this.updateProduct(this.productData.regular);
    this.updateURL(this.regularHandle);
  }
  
  updateProduct(product) {
    if (!product) return;
    
    // Update prices
    this.updatePrices(product);
    
    // Update variant selectors
    this.updateVariantSelectors(product);
    
    // Update quantity breaks if they exist
    this.updateQuantityBreaks(product);
    
    // Update form data
    this.updateFormData(product);
    
    // Trigger product info update event
    this.dispatchEvent(new CustomEvent('subscription:changed', {
      detail: { product: product },
      bubbles: true
    }));
  }
  
  updatePrices(product) {
    const priceElements = document.querySelectorAll(`#price-${this.sectionId} .price__regular .price-item--regular`);
    const salePriceElements = document.querySelectorAll(`#price-${this.sectionId} .price__sale .price-item--sale`);
    const comparePriceElements = document.querySelectorAll(`#price-${this.sectionId} .price__sale .price-item--regular`);
    
    const selectedVariant = product.selected_or_first_available_variant || product.variants[0];
    
    priceElements.forEach(el => {
      el.textContent = this.formatMoney(selectedVariant.price);
    });
    
    if (selectedVariant.compare_at_price && selectedVariant.compare_at_price > selectedVariant.price) {
      salePriceElements.forEach(el => {
        el.textContent = this.formatMoney(selectedVariant.price);
      });
      comparePriceElements.forEach(el => {
        el.textContent = this.formatMoney(selectedVariant.compare_at_price);
      });
    }
  }
  
  updateVariantSelectors(product) {
    const variantSelects = document.querySelector(`variant-selects[data-section="${this.sectionId}"]`);
    const variantRadios = document.querySelector(`variant-radios[data-section="${this.sectionId}"]`);
    
    if (variantSelects || variantRadios) {
      // Update the product data
      const variantPicker = variantSelects || variantRadios;
      if (variantPicker) {
        variantPicker.dataset.url = `/products/${product.handle}`;
        
        // Update variant options
        const scriptTag = variantPicker.querySelector('script[type="application/json"]');
        if (scriptTag) {
          scriptTag.textContent = JSON.stringify(product.variants);
        }
        
        // Refresh the variant picker
        if (variantPicker.updateOptions) {
          variantPicker.updateOptions();
        }
      }
    }
  }
  
  updateQuantityBreaks(product) {
    const quantityBreaks = document.querySelector(`quantity-breaks[data-section="${this.sectionId}"]`);
    
    if (quantityBreaks && product.variants) {
      // Update quantity breaks with new product data
      quantityBreaks.currentProduct = product;
      
      // Recalculate prices
      if (quantityBreaks.updatePrices) {
        quantityBreaks.updatePrices(product);
      }
      
      // Update variant selectors in quantity breaks
      const breakVariantSelects = quantityBreaks.querySelectorAll('.quantity-break-variant-select');
      breakVariantSelects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '';
        
        product.variants.forEach(variant => {
          const option = document.createElement('option');
          option.value = variant.id;
          option.textContent = variant.title;
          option.disabled = !variant.available;
          if (variant.id == currentValue) {
            option.selected = true;
          }
          select.appendChild(option);
        });
      });
    }
  }
  
  updateFormData(product) {
    const productForm = document.querySelector(`#product-form-${this.sectionId}`);
    
    if (productForm) {
      // Update the product ID in the form
      const idInput = productForm.querySelector('input[name="id"]');
      if (idInput && product.selected_or_first_available_variant) {
        idInput.value = product.selected_or_first_available_variant.id;
      }
      
      // Add a hidden field to indicate subscription status
      let subscriptionInput = productForm.querySelector('input[name="properties[_subscription]"]');
      if (!subscriptionInput) {
        subscriptionInput = document.createElement('input');
        subscriptionInput.type = 'hidden';
        subscriptionInput.name = 'properties[_subscription]';
        productForm.appendChild(subscriptionInput);
      }
      subscriptionInput.value = this.checkbox.checked ? 'true' : 'false';
    }
  }
  
  updateURL(handle) {
    // Update the URL without reloading the page
    const newUrl = `/products/${handle}`;
    window.history.replaceState({ handle: handle }, '', newUrl);
  }
  
  formatMoney(cents) {
    // Simple money formatting - you should use your theme's money formatting function
    return Shopify.formatMoney ? Shopify.formatMoney(cents) : `$${(cents / 100).toFixed(2)}`;
  }
}

customElements.define('subscription-toggle', SubscriptionToggle);
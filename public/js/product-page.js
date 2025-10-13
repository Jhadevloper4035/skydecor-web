

// product Enquiry Modal Functions
function openProductEnquiry() {
  const modal = document.getElementById("productEnquiryModal");
  modal.classList.add("product-enquiry-show");
  document.body.style.overflow = "hidden";
}

function closeProductEnquiry() {
  const modal = document.getElementById("productEnquiryModal");
  modal.classList.remove("product-enquiry-show");
  document.body.style.overflow = "";
  setTimeout(() => {
    resetProductEnquiryForm();
  }, 400);
}

function closeProductEnquiryOnOutside(event) {
  if (event.target.classList.contains("product-enquiry-modal")) {
    closeProductEnquiry();
  }
}

// Close on Escape key
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    const modal = document.getElementById("productEnquiryModal");
    if (modal.classList.contains("product-enquiry-show")) {
      closeProductEnquiry();
    }
  }
});

// Validation Functions
function validateProductEnquiryField(field) {
  const value = field.value.trim();
  const fieldId = field.id;
  const errorElement = document.getElementById(fieldId + "Error");
  let isValid = true;
  let errorMessage = "";

  // Remove previous validation classes
  field.classList.remove("product-enquiry-valid", "product-enquiry-invalid");

  if (field.hasAttribute("required") && value === "") {
    isValid = false;
    errorMessage = "This field is required";
  } else if (field.hasAttribute("required") || value !== "") {
    switch (fieldId) {
      case "productEnquiryFullName":
        if (value.length < 2) {
          isValid = false;
          errorMessage = "Name must be at least 2 characters";
        } else if (!/^[a-zA-Z\s]+$/.test(value)) {
          isValid = false;
          errorMessage = "Name should contain only letters";
        }
        break;

      case "productEnquiryEmail":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          isValid = false;
          errorMessage = "Please enter a valid email address";
        }
        break;

      case "productEnquiryPhone":
        const phoneRegex = /^[0-9+\s\-()]{10,15}$/;
        if (!phoneRegex.test(value)) {
          isValid = false;
          errorMessage = "Please enter a valid phone number (10-15 digits)";
        }
        break;

      case "productEnquiryCategory":
        if (value === "") {
          isValid = false;
          errorMessage = "Please select a category";
        }
        break;

      case "productEnquiryMessage":
        if (value.length < 10) {
          isValid = false;
          errorMessage = "Message must be at least 10 characters";
        } else if (value.length > 1000) {
          isValid = false;
          errorMessage = "Message must not exceed 1000 characters";
        }
        break;

      case "productEnquiryCompany":
        if (value.length > 100) {
          isValid = false;
          errorMessage = "Company name must not exceed 100 characters";
        }
        break;
    }
  }

  if (isValid && (field.hasAttribute("required") || value !== "")) {
    field.classList.add("product-enquiry-valid");
    errorElement.style.display = "none";
  } else if (!isValid) {
    field.classList.add("product-enquiry-invalid");
    errorElement.textContent = errorMessage;
    errorElement.style.display = "block";
  }

  return isValid;
}

// Real-time validation
const productEnquiryFormFields = [
  "productEnquiryFullName",
  "productEnquiryEmail",
  "productEnquiryPhone",
  "productEnquiryCompany",
  "productEnquiryCategory",
  "productEnquiryBudget",
  "productEnquiryMessage",
];

productEnquiryFormFields.forEach((fieldId) => {
  const field = document.getElementById(fieldId);
  if (field) {
    field.addEventListener("blur", function () {
      validateProductEnquiryField(this);
    });

    field.addEventListener("input", function () {
      if (this.classList.contains("product-enquiry-invalid")) {
        validateProductEnquiryField(this);
      }
    });
  }
});

// Form submission
const productEnquiryForm = document.getElementById("productEnquiryForm");
productEnquiryForm.addEventListener("submit", function (e) {
  e.preventDefault();

  let isFormValid = true;
  const requiredFields = [
    "productEnquiryFullName",
    "productEnquiryEmail",
    "productEnquiryPhone",
    "productEnquiryCategory",
    "productEnquiryMessage",
  ];

  requiredFields.forEach((fieldId) => {
    const field = document.getElementById(fieldId);
    if (!validateProductEnquiryField(field)) {
      isFormValid = false;
    }
  });

  // Validate optional fields if they have values
  const optionalFields = ["productEnquiryCompany", "productEnquiryBudget"];
  optionalFields.forEach((fieldId) => {
    const field = document.getElementById(fieldId);
    if (field.value.trim() !== "") {
      validateProductEnquiryField(field);
    }
  });

  if (isFormValid) {
    // Hide form and show success message
    document.getElementById("productEnquiryFormContent").style.display = "none";
    document.getElementById("productEnquiryFooter").style.display = "none";
    document.getElementById("productEnquirySuccess").style.display = "block";

    // Auto close after 2.5 seconds
    setTimeout(function () {
      closeProductEnquiry();
    }, 2500);
  } else {
    // Scroll to first error
    const firstError = document.querySelector(".product-enquiry-invalid");
    if (firstError) {
      firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      firstError.focus();
    }
  }
});

// Reset form function
function resetProductEnquiryForm() {
  productEnquiryForm.reset();

  // Remove all validation classes
  const allFields = document.querySelectorAll(
    ".product-enquiry-input, .product-enquiry-select, .product-enquiry-textarea"
  );
  allFields.forEach((field) => {
    field.classList.remove("product-enquiry-valid", "product-enquiry-invalid");
  });

  // Hide all error messages
  const allErrors = document.querySelectorAll(".product-enquiry-error");
  allErrors.forEach((error) => {
    error.style.display = "none";
  });

  // Reset display states
  document.getElementById("productEnquiryFormContent").style.display = "block";
  document.getElementById("productEnquiryFooter").style.display = "flex";
  document.getElementById("productEnquirySuccess").style.display = "none";
}


document.addEventListener("DOMContentLoaded", function () {
  const pageUrl = encodeURIComponent(window.location.href);

  // WhatsApp
  document.getElementById("shareWhatsApp").addEventListener("click", function (e) {
    e.preventDefault();
    window.open(`https://wa.me/?text=${pageUrl}`, "_blank");
  });

  // Facebook
  document.getElementById("shareFacebook").addEventListener("click", function (e) {
    e.preventDefault();
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`,
      "_blank",
      "width=600,height=400"
    );
  });

  // LinkedIn
  document.getElementById("shareLinkedIn").addEventListener("click", function (e) {
    e.preventDefault();
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`,
      "_blank",
      "width=600,height=400"
    );
  });

  // Instagram — just copy link (no web share API)
  document.getElementById("shareInstagram").addEventListener("click", function (e) {
    e.preventDefault();
    if (navigator.share) {
      navigator.share({
        url: window.location.href,
      }).catch(() => {});
    } else {
      // Fallback: copy link for desktop users
      const temp = document.createElement("textarea");
      temp.value = window.location.href;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand("copy");
      document.body.removeChild(temp);
      alert("Link copied! You can paste it in Instagram or anywhere you like.");
    }
  });

  // Copy Link
  document.getElementById("copyLink").addEventListener("click", function (e) {
    e.preventDefault();
    const temp = document.createElement("textarea");
    temp.value = window.location.href;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    document.body.removeChild(temp);

    this.classList.add("copied");
    this.querySelector("i").className = "fas fa-check";

    setTimeout(() => {
      this.classList.remove("copied");
      this.querySelector("i").className = "fas fa-link";
    }, 2000);
  });
});

import React, { useState } from 'react';
import './Addproduct.css';
import upload_area from '../../assets/upload_area.svg';

const Addproduct = () => {
  const [image, setImage] = useState(null);
  const [productDetails, setProductDetails] = useState({
    name: '',
    image: '',
    category: 'women',
    new_price: '',
    old_price: '',
  });

  const imageHandler = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setProductDetails({ ...productDetails, image: file });
  };

  const changeHandler = (e) => {
    const { name, value } = e.target;
    setProductDetails({
      ...productDetails,
      [name]: name.includes('price') ? parseFloat(value) || 0 : value,
    });
  };

  const Add_Product = async () => {
    if (!productDetails.name || !productDetails.image || !productDetails.old_price || !productDetails.new_price) {
      alert('Please fill in all fields.');
      return;
    }

    console.log(productDetails);
    let responseData;
    let product = { ...productDetails }; 

    const formData = new FormData();
    formData.append('product', image);

    try {
      const response = await fetch('https://e-commerce-js8k.onrender.com/upload', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: formData,
      });
      responseData = await response.json();
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image.');
      return;
    }

    if (responseData.success) {
      product.image = responseData.image_url;
      console.log(product);

      try {
        const response = await fetch('https://e-commerce-js8k.onrender.com/addproduct', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(product),
        });
        const data = await response.json();
        data.success ? alert("Product added successfully") : alert("Failed to add product");
      } catch (error) {
        console.error('Error adding product:', error);
        alert('Failed to add product.');
      }
    }
  };

  return (
    <div className="add-product">
      <div className="addproduct-itemfield">
        <p>Product Title</p>
        <input value={productDetails.name} onChange={changeHandler} type="text" name="name" placeholder="Type here" />
      </div>
      <div className="addproduct-price">
        <div className="addproduct-itemfield">
          <p>Price</p>
          <input value={productDetails.old_price} onChange={changeHandler} type="text" name="old_price" placeholder="Type here" />
        </div>
        <div className="addproduct-itemfield">
          <p>Offer Price</p>
          <input value={productDetails.new_price} onChange={changeHandler} type="text" name="new_price" placeholder="Type here" />
        </div>
      </div>
      <div className="addproduct-itemfield">
        <p>Product Category</p>
        <select value={productDetails.category} onChange={changeHandler} name="category" className="add-product-selector">
          <option value="women">Women</option>
          <option value="men">Men</option>
          <option value="kid">Kid</option>
        </select>
      </div>
      <div className="addproduct-itemfield">
        <label htmlFor="file-input">
          <img src={image ? URL.createObjectURL(image) : upload_area} className="addproduct-thumbnail-img" alt="Product" />
        </label>
        <input onChange={imageHandler} type="file" name="image" id="file-input" hidden />
      </div>
      <button onClick={Add_Product} className="addproduct-btn">ADD</button>
    </div>
  );
};

export default Addproduct;
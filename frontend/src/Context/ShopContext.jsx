import React, { createContext, useEffect, useState } from "react";
export const ShopContext = createContext(null);

const getDefaultCart = () => {
  let cart = {};
  for (let index = 0; index < 300 + 1; index++) {
    cart[index] = 0;
  }
  return cart;
};

const ShopContextProvider = (props) => {
  const[all_product,setAllProduct]=useState([]);  
  const [cartItems, setCartItems] = useState(getDefaultCart());

  useEffect(()=>{
    fetch('https://e-commerce-js8k.onrender.com/allproducts')
    .then((response)=>response.json())
    .then((data)=>setAllProduct(data))

    if(localStorage.getItem('auth-token')){
      fetch('https://e-commerce-js8k.onrender.com/getcart',{
        method:'POST',
        headers:{
          Accept:'application/form-data',
          'Content-Type':'application/json',
          'auth-token':`${localStorage.getItem('auth-token')}`,
        },
        body:"",
      }).then((response)=>response.json())
        .then((data)=>setCartItems(data));
    }

  },[])
  // here we are fetching all the products from the backend and storing it in the state all_product 

  const addToCart = (itemId) => {
    setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] + 1 }));
        if(localStorage.getItem('auth-token')){
            fetch('https://e-commerce-js8k.onrender.com/addtocart',{
                method:'POST',
                headers:{
                    'Content-Type':'application/json',
                    'auth-token':`${localStorage.getItem('auth-token')}`,
                },  
                body:JSON.stringify({"itemId":itemId}),
            })
            .then((response)=>response.json())
            .then((data)=>console.log(data));
        }
    
      };

const removeFromCart = (itemId) => {
  if (!localStorage.getItem('auth-token')) return; // Ensure user is logged in

  // Optimistically update UI before making API request
  setCartItems((prev) => ({
    ...prev,
    [itemId]: prev[itemId] > 0 ? prev[itemId] - 1 : 0, // Prevent negative values
  }));

  fetch('https://e-commerce-js8k.onrender.com/removefromcart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'auth-token': `${localStorage.getItem('auth-token')}`,
    },
    body: JSON.stringify({ itemId }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log('Server Response:', data);
      // Optionally: Re-fetch cart data from backend to ensure consistency
      fetchCartData();
    })
    .catch((error) => {
      console.error('Error removing item:', error);
      // Revert UI update in case of failure
      setCartItems((prev) => ({
        ...prev,
        [itemId]: prev[itemId] + 1,
      }));
    });
};

// Function to fetch the updated cart from the backend
const fetchCartData = () => {
  fetch('https://e-commerce-js8k.onrender.com/getcart', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'auth-token': `${localStorage.getItem('auth-token')}`,
    },
  })
    .then((res) => res.json())
    .then((data) => {
      setCartItems(data.cart); // Assuming backend returns the updated cart
    })
    .catch((err) => console.error('Error fetching cart:', err));
};

// Fetch cart on component mount
useEffect(() => {
  fetchCartData();
}, []);

  const getTotalCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        let itemInfo = all_product.find(
          (product) => product.id === Number(item)
        );
        totalAmount += itemInfo.new_price * cartItems[item];
      }
    }
    return totalAmount;
  };

  const getTotalCartItems = ()=>{
    let totalItem = 0;
    for(const item in cartItems){
      if(cartItems[item]>0){
        totalItem+=cartItems[item];
      }
    }
    return totalItem;
  }

  const contextValue = {
    getTotalCartItems,
    getTotalCartAmount,
    all_product,
    cartItems,
    addToCart,
    removeFromCart,
  };
  return (
    <ShopContext.Provider value={contextValue}>
      {props.children}
    </ShopContext.Provider>
  );
};
export default ShopContextProvider;
// Shop Context would help us to manage the state of the application by removing the need of prop drilling and making the code more readable and maintainable.

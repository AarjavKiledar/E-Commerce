import React, { useContext } from 'react'
import { useParams } from 'react-router-dom'
import { ShopContext } from '../Context/ShopContext';
import BreadCrumb from '../Components/BreadCrumb/Breadcrumb';
import ProductDisplay from '../Components/ProductDisplay/ProductDisplay';
import DescriptionBox from '../Components/DescriptionBox/DescriptionBox';
import RelatedProducts from '../Components/RelatedProducts/RelatedProducts';

const Product = () => {
    const {all_product} = useContext(ShopContext);
    const {productId}=useParams();
    const product=all_product.find((e)=>e.id === Number(productId));
    // here use params is used to get the id of the product from the url and then we are using the find method to get the product with the same id as the id in the url.
    return (
    <div>
      <BreadCrumb product={product}/>
      <ProductDisplay product={product}/>
      <DescriptionBox />
      <RelatedProducts />
    </div>
  )
}

export default Product
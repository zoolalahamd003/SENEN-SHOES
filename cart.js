let cartproducts = localStorage.getItem("cartproducts")
cartproducts = JSON.parse(cartproducts)
console.log(cartproducts)

let total=0

let items=0


if(cartproducts==null){
    cartproducts=[]
}

let cartitems = document.getElementById("cartitems")

let count = 0

let cartremove=document.getElementById("cartremove")

let modal=document.getElementById("modal")

let totalitems=document.getElementById("totalitems")

for(let i = 0; i < cartproducts.length; i++)
{
    count += cartproducts[i].quantity
}
cartspan.textContent = "(" + count + ")"

let totalcost=document.getElementById("totalcost")

cartproducts.forEach((element,index) => {

    let imagecreation = document.createElement("img")

    let namecreate = document.createElement("p")

    let idcreate = document.createElement("p")

    let gendercreate = document.createElement("p")

    let conditioncreate = document.createElement("p")

    let pricecreate = document.createElement("p")

    let divcreate = document.createElement("div")

    let deletefromcartbtn=document.createElement("button")

    deletefromcartbtn.textContent="REMOVE FROM CART"

    divcreate.classList.add("product-card")

    namecreate.classList.add("product-name")


    
    pricecreate.classList.add("product-details")
    
    gendercreate.classList.add("product-details")
    
    conditioncreate.classList.add("product-details")


    imagecreation.src = element.image

    pricecreate.textContent = "PRICE RS:"
    
    namecreate.textContent = element.name

    idcreate.textContent = element.id

    pricecreate.textContent += element.price

    gendercreate.textContent = element.gender

    conditioncreate.textContent = element.condition

    let quantitycreate = document.createElement("p")

    quantitycreate.classList.add("product-details")

    quantitycreate.textContent = "Quantity: " + element.quantity

    cartitems.append(divcreate)

    divcreate.append(imagecreation)

    divcreate.append(namecreate)

    divcreate.append(pricecreate)

    divcreate.append(conditioncreate)

    divcreate.append(gendercreate)

     divcreate.append(quantitycreate)

     divcreate.append(deletefromcartbtn)

    element.price=Number(element.price)

    total+=element.price*element.quantity

    deletefromcartbtn.classList.add("delete-btn")





deletefromcartbtn.addEventListener("click",function(){
    console.log("the remove from cart button has been")
    cartproducts.splice(index,1)
    localStorage.setItem("cartproducts", JSON.stringify(cartproducts))
    divcreate.remove()
    totalitems.textContent+="  :"
    items = 0
total = 0
   for(let i = 0; i < cartproducts.length; i++)
{
    items += cartproducts[i].quantity
    total += cartproducts[i].price * cartproducts[i].quantity
}
   totalitems.textContent = "TOTAL ITEMS : " + items
totalcost.textContent = "TOTAL COST : RS " + total
cartspan.textContent = "(" + items + ")"




})
localStorage.setItem("buyproducts",
JSON.stringify(cartproducts)
)

    
})




cartremove.addEventListener('click',function(){
    modal.style.display="flex"
})



let surebtn=document.getElementById("surebtn")
surebtn.addEventListener("click",function(){
    modal.style.display="none"
    localStorage.removeItem("cartproducts")
    cartitems.textContent=""
    count=0
    cartspan.textContent = "(" + count + ")"
    totalitems.textContent="TOTAL ITEMS :"
    totalcost.textContent="TOTAL COST :"

})



let cancelbtn=document.getElementById("cancelbtn")
cancelbtn.addEventListener("click",function(){
    modal.style.display="none"
})
totalcost.textContent+="  RS:"
totalcost.textContent+=total



for(let i=0;i<cartproducts.length;i++)
{
    items+=cartproducts[i].quantity
}
totalitems.textContent+="  :"
totalitems.textContent+=items

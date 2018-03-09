function OffCanvasMenu(menuWidth, menuData, textProp, linkProp){
    let backdop = document.getElementById('offcanvas-menu-backdop');
    let menu = document.getElementById('offcanvas-menu');

    if(!backdop){
        backdop = document.createElement('div');
        backdop.id = 'offcanvas-menu-backdop';
        menu = document.createElement('div');
        menu.id = 'offcanvas-menu';

        backdop.style.left = 0 - menuWidth + 'px';
        backdop.style.transition = '0.5s';

        menu.style.width = menuWidth + 'px';

        let div1 = document.createElement('div');
        div1.className = 'off-menu-container active';
        let div2 = document.createElement('div');
        div2.className = 'off-menu-container';

        menu.appendChild(div1);
        menu.appendChild(div2);

        backdop.appendChild(menu);

        document.body.prepend(backdop);
        document.body.style.transform = 'translateX(' + menuWidth +'px)';

        backdop.addEventListener('click', function(e){
            if(e.target.id == 'offcanvas-menu-backdop'){
                document.body.style.transform = 'translateX(0px)';
                backdop.style.display='none';
            }
            
        });
    }else{
        backdop.style.display = 'block';
        document.body.style.transform = 'translateX(' + menuWidth +'px)';
    }

    //build menu tree

    buildTree(menuData, null);

    function buildTree(data, parent){
        if(data.children && data.children.length){
            //clean current container and add new entries
            
            let activeContainer = document.querySelectorAll('.off-menu-container.active')[0];

            let inactiveContainer = document.querySelectorAll('.off-menu-container:not(.active)')[0];
            //clean for new entries to come
            removeAllChild(inactiveContainer);

            activeContainer.classList.remove('active');
            inactiveContainer.classList.add('active');

            if(parent){

                let backEntry = document.createElement('div');
                backEntry.className = 'offcanvas-menu-item off-menu-back';
                let a = document.createElement('a');
                a.href='javascript:;';
                a.text = data[textProp];
                backEntry.appendChild(a);
    
                let back = document.createElement('a');
                back.className = "off-arrow off-arrow-left";
                back.href='javascript:;';
                backEntry.prepend(back);

                inactiveContainer.prepend(backEntry);
    
                back.addEventListener('click',function(){
                    activeContainer.classList.add('active');
                    inactiveContainer.classList.remove('active');
                });

            }

            data.children.forEach((entry, index)=>{
                let div = document.createElement('div');
                div.className = 'offcanvas-menu-item';
                if(entry.children && entry.children.length){
                    div.className += ' has-sub';
                }
                inactiveContainer.appendChild(div);

                let a = document.createElement('a');
                a.href=entry[linkProp];
                a.text = entry[textProp];
                div.appendChild(a);

                if(entry.children && entry.children.length){

                    let next = document.createElement('a');
                    next.className = "off-arrow off-arrow-right";
                    next.href='javascript:;';
                    div.prepend(next);
    
                    next.addEventListener('click',function(){
                        buildTree(entry, data);
                    });
                }
            })
        }
    }

    function removeAllChild(myNode){
        while (myNode.firstChild) {
            myNode.removeChild(myNode.firstChild);
        }
    }



    
}
var budgetController = ( function() {
    
    var Expense = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    }
    
    Expense.prototype.calcPercentage = function(totalIncome) {
        if(totalIncome > 0) {
            this.percentage = Math.round(this.value / totalIncome * 100);
        }else {
            this.percentage = -1;
        }
    };
    
    var Income = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    };
    
    var calculateTotal = function(type) {
        var sum = 0;
        data.allItems[type].forEach(function(cur) {
            sum += cur.value;
        });
        data.totals[type] = sum;
    };
    
    var data = {
        allItems: {
           exp : [],
           inc : []
        },
        totals : {
            exp : 0,
            inc : 0
        },
        budget : 0,
        percentage: -1
    };
    
    return {
        addItem : function(type, des, val) {
            var ID,newItem;
            
            if(data.allItems[type].length > 0) {
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
            } else {
                ID = 0;
            }
            
            if(type === 'exp') {
                newItem = new Expense(ID, des, val);
            } else if(type === 'inc') {
                newItem = new Income(ID, des, val);
            }
            
            data.allItems[type].push(newItem); // due to same name 'exp' or 'inc'
            return newItem;
        },
        
        deleteItem : function(type, id) {
            var index,ids;
            
            ids = data.allItems[type].map(function(cur) {
                return cur.id;
            });
            
            index = ids.indexOf(id);
            
            if(index !== -1) {
                data.allItems[type].splice(index,1);
            }
        },
        
        calculateBudget : function() {
            //Total exp and inc
            calculateTotal('inc');
            calculateTotal('exp');
            
            //calculate budget incomes-expenses
            data.budget = data.totals.inc - data.totals.exp;
            
            //calculate percentage of income spent
            if(data.totals.inc > 0) {
                data.percentage = Math.round( (data.totals.exp / data.totals.inc )*100 );
            } else {
                data.percentage = -1;
            }
        },
        
        calculatePercentages : function() {
            data.allItems.exp.forEach(function(cur) {
                cur.calcPercentage(data.totals.inc);
            });
        },
        
        getBudget : function() {
            return {
                budget : data.budget,
                totalInc : data.totals.inc,
                totalExp : data.totals.exp,
                percentage: data.percentage
            };
        },
        
        getPercentages : function() {
            var allPer = data.allItems.exp.map(function(cur) {
                return cur.percentage;
            });
            return allPer;
        },
        
        testing : function() {
            console.log(data);
        }
    };
    
}
)();




var UIController = (function() {
    
    var DOMstrings = {
        inputType: '.add__type',
        inputValue: '.add__value',
        inputDescription : '.add__description',
        inputBtn : '.add__btn',
        incomeContainer : '.income__list',
        expensesContainer : '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expensesLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage',
        container : '.container',
        expensesPercLabel: '.item__percentage',
        dateLabel: '.budget__title--month'
    };
    
    var nodeListForEach = function(list, callback) {
        for(var i=0 ; i<list.length ; i++) {
             callback(list[i], i);
        }
    };
    
    var formatNumber = function(num, type) {
       var int,dec,numSplit;
        /*
            + or - before number
            exactly 2 decimal points
            comma separating the thousands

            2310.4567 -> + 2,310.46
            2000 -> + 2,000.00
            */  
        num = Math.abs(num);
        num = num.toFixed(2);
        numSplit = num.split('.');
        
        int = numSplit[0];
        if(int.length > 3) {
            int = int.substr(0, int.length-3) + ',' + int.substr(int.length-3, 3);   
        }
        
        dec = numSplit[1];
        return (type==='inc' ? '+' : '-') + ' ' + int + '.' + dec;  
    };
    
    return {
        getInput: function() {
            return {
               type:  document.querySelector(DOMstrings.inputType).value, //exp or inc
               description : document.querySelector(DOMstrings.inputDescription).value, 
               value : parseFloat(document.querySelector(DOMstrings.inputValue).value)
            };
        },
        
        getDOMStrings : function() {
            return DOMstrings;
        },
        
        addListItem : function(obj, type) {
            var html, newHtml, element;
            
            if(type==='inc') {
                element = DOMstrings.incomeContainer;
                
                html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div> <div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div</div>'; //% % used just to distinguish
            } else if(type === 'exp') {
                element = DOMstrings.expensesContainer;
                
                html = '<div class="item clearfix" id="exp-%id%"> <div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div> <div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            }
            
            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%description%', obj.description);
            newHtml = newHtml.replace('%value%',formatNumber(obj.value, type));
            
            document.querySelector(element).insertAdjacentHTML('beforeend' ,newHtml);
        },
        
        deleteListItem : function(selectorId) {
            
            var el = document.getElementById(selectorId);
            el.parentNode.removeChild(el);
            
        },
        
        clearFields : function() {
            var fields, fieldsArray;
            
            fields = document.querySelectorAll(DOMstrings.inputValue + ', ' + DOMstrings.inputDescription);
            fieldsArray = Array.prototype.slice.call(fields);
            
            fieldsArray.forEach(function(current, index, array) {
               current.value = ""; 
            });
            
            fieldsArray[0].focus();
        },
        
        displayBudget : function(obj) {
            var type;
            
            obj.budget > 0 ? type = 'inc' : type = 'exp';
            document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(obj.budget, type);
            document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');
            document.querySelector(DOMstrings.expensesLabel).textContent = formatNumber(obj.totalExp, 'exp');
            
            if(obj.percentage > 0) {
                document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage + '%';
            } else {
                document.querySelector(DOMstrings.percentageLabel).textContent = '---';
            }
            
        },
        
        displayPercentages : function(percentages) {
            var fields = document.querySelectorAll(DOMstrings.expensesPercLabel);
            
            nodeListForEach(fields, function(current, index) {
                if(percentages[index] > 0) {
                    current.textContent = percentages[index] +'%';
                } else {
                    current.textContent = '---';
                }
            });
        },
        
        displayDate : function() {
            var now,month,months,year;
            now = new Date();
            
            months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            month = now.getMonth();
            year = now.getFullYear();
            document.querySelector(DOMstrings.dateLabel).textContent = months[month] + ' ' + year;
        },
        
        changedType : function() {
            var fields = document.querySelectorAll(DOMstrings.inputType + ',' + DOMstrings.inputValue + ',' + DOMstrings.inputDescription );
            
            nodeListForEach(fields, function(cur) {
                cur.classList.toggle('red-focus');
            });
            
            document.querySelector(DOMstrings.inputBtn).classList.toggle('red');
        }
    };
    
})();




var controller = ( function(budgetCtrl, UICtrl) {
    
    var setUpEventListeners = function() {
        var DOM = UICtrl.getDOMStrings();
        document.querySelector(DOM.inputBtn).addEventListener('click',ctrlAddItem);

        document.addEventListener('keypress',function(event) {
            if(event.keyCode === 13 || event.which === 13) {
                ctrlAddItem();
            }
        });
        
        document.querySelector(DOM.container).addEventListener('click',ctrlDeleteItem); //container here is the commom one for income and expenses, using event deligation concept
        
        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);
    };
    
    var updateBudget = function() {
        //Calc the budget
        budgetCtrl.calculateBudget();
        
        //return the budget
        var budget = budgetCtrl.getBudget();
        
        //display to UI
        UICtrl.displayBudget(budget);
    };
    
    var updatePercentages = function() { // we need to update percentages while both adding and deleting percentages, right ?
        
        //Calc the percentages
        budgetCtrl.calculatePercentages();
        
        //get from the budget controller
        var percentages = budgetCtrl.getPercentages();
        
        //update them to the UI
        UICtrl.displayPercentages(percentages);
        
    };
    
    var ctrlAddItem = function() {
        
        //1. GET INPUT
        var input = UICtrl.getInput();
        
        if(input.value>0 && input.description !== "" && !isNaN(input.value)) {
            //2.ADD TO BUDGET CONTROLLER
            var newItem = budgetCtrl.addItem(input.type, input.description, input.value);

            //3. ADD IT TO UI
            UICtrl.addListItem(newItem, input.type);

            //4.CLEAR FIELDS
            UICtrl.clearFields();

            //5.CALCULATE AND UPDATE THE BUDGET
            updateBudget();
            
            //6.CALC AND UPDATE PERCENTAGES
            updatePercentages();
        }
    };
    
    var ctrlDeleteItem = function(event) {
        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id; //event.target : where event is fired
        
        //here we are taking adv of that only onething is having id over there and that what we're interested in
        if(itemID) {
            splidId = itemID.split('-');
            type = splidId[0];
            ID = parseInt(splidId[1]);
            
            //delete the item from data str
            budgetCtrl.deleteItem(type,ID);
            
            //delete item from UI
            UICtrl.deleteListItem(itemID);
            
            //update and show new budget
            updateBudget();
            
            //calc and update percentages
            updatePercentages();
        }
        
    };
    
    return {
        init : function() {
            console.log('Application started');
            UICtrl.displayDate();
            setUpEventListeners();
            UICtrl.displayBudget({
                budget : 0,
                totalInc : 0,
                totalExp : 0,
                percentage: -1
            });
        }
    }

})(budgetController, UIController);




controller.init();

/*document.addEventListener('keypress',function(ev) {
    console.log(event.which);
});

  var fields, fieldsArray;
            
            fields = document.querySelectorAll('.add__value, .add__description');
            fieldsArray = Array.prototype.slice.call(fields);
            document.querySelector('keypress', function(event) {
                if(event.keyCode === 49 && fieldsArray[0].hasFocus()) {
                   fieldsArray[1].focus();
                    console.log('focus changed');
                }
            });    experiments by vinay*/





  










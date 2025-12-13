import { createClient } from "@/app/_shared/utils/supabase/server";

export interface MenuAnalysisItem {
    name: string;
    category: string;
    quantity: number;
    revenue: number; // production price * qty
    price: number; // avg unit price
    cost: number; // unit cost
    totalProfit: number; // revenue - (cost * qty)
    margin: number; // margin %
    type: 'star' | 'cashcow' | 'gem' | 'dog' | 'question';
}

export async function getMenuAnalysis(storeId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // 1. Fetch Sales (to filter by store/user)
    const { data: sales, error: salesFetchError } = await supabase
        .from('mvp_sales')
        .select('id')
        .eq('user_id', user.id)
        .eq('store_id', storeId);

    if (salesFetchError) throw salesFetchError;

    const saleIds = sales.map(s => s.id);

    // If no sales found, return empty result early
    if (saleIds.length === 0) {
        return [];
    }

    // 2. Fetch Sale Items
    const { data: salesData, error: salesError } = await supabase
        .from('sale_items')
        .select('name, quantity, total_price, unit_price')
        .in('sale_id', saleIds);

    if (salesError) throw salesError;

    // Note: menu_items table doesn't exist in current schema
    // Using sale_items data only with default cost = 0
    // In future, could add menu_items table for cost tracking
    const menuMap = new Map<string, any>();

    // 3. Aggregate Sales Data
    const analysisMap = new Map<string, { quantity: number, revenue: number, unitPrices: number[] }>();

    salesData?.forEach((item: any) => {
        const current = analysisMap.get(item.name) || { quantity: 0, revenue: 0, unitPrices: [] };
        analysisMap.set(item.name, {
            quantity: current.quantity + item.quantity,
            revenue: current.revenue + item.total_price,
            unitPrices: [...current.unitPrices, item.unit_price]
        });
    });

    // 4. Build Result
    const result: MenuAnalysisItem[] = [];

    // Helper to calculate average
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

    analysisMap.forEach((val, name) => {
        const menuInfo = menuMap.get(name);
        const cost = menuInfo?.cost || 0;
        const category = menuInfo?.category || '기타';
        const avgPrice = avg(val.unitPrices);

        const totalCost = cost * val.quantity;
        const totalProfit = val.revenue - totalCost;
        const margin = val.revenue > 0 ? (totalProfit / val.revenue) * 100 : 0;

        result.push({
            name,
            category,
            quantity: val.quantity,
            revenue: val.revenue,
            price: Math.round(avgPrice),
            cost,
            totalProfit,
            margin,
            type: 'question' // Logic to be applied later based on averages
        });
    });

    // 5. Apply BCG Matrix Logic
    // Calculate Averages for the set
    if (result.length > 0) {
        const avgQty = result.reduce((sum, item) => sum + item.quantity, 0) / result.length;
        const avgProfit = result.reduce((sum, item) => sum + item.totalProfit, 0) / result.length;

        result.forEach(item => {
            if (item.quantity >= avgQty && item.totalProfit >= avgProfit) item.type = 'star'; // High Vol, High Profit
            else if (item.quantity >= avgQty && item.totalProfit < avgProfit) item.type = 'cashcow'; // High Vol, Low Profit (Cash flow)
            else if (item.quantity < avgQty && item.totalProfit >= avgProfit) item.type = 'gem'; // Low Vol, High Profit (Hidden Gem / Premium)
            else item.type = 'dog'; // Low Vol, Low Profit
        });
    }

    return result.sort((a, b) => b.revenue - a.revenue); // Sort by Revenue desc
}

export async function updateMenuCost(_storeId: string, _name: string, _cost: number, _price: number) {
    // Note: menu_items table doesn't exist in current schema
    // This function is a placeholder for future implementation
    // For now, cost tracking is not supported
    console.warn('updateMenuCost: menu_items table not available, cost update skipped');
    return;
}

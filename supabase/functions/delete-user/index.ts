import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create client with user's auth to verify they're an admin
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Get the current user
    const { data: { user: currentUser }, error: userError } = await userClient.auth.getUser()
    if (userError || !currentUser) {
      console.error('Auth error:', userError)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if the current user is an admin
    const { data: roleData, error: roleError } = await userClient
      .from('user_roles')
      .select('role')
      .eq('user_id', currentUser.id)
      .eq('role', 'admin')
      .single()

    if (roleError || !roleData) {
      console.error('Not an admin:', roleError)
      return new Response(JSON.stringify({ error: 'Only admins can delete users' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get the user ID to delete from the request body
    const { userId } = await req.json()
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Prevent deleting yourself
    if (userId === currentUser.id) {
      return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if the user to delete is also an admin (protect admin accounts)
    const { data: targetRoleData } = await userClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single()

    if (targetRoleData) {
      return new Response(JSON.stringify({ error: 'Cannot delete admin accounts' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Use service role client to delete related data and the user
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting comprehensive user data deletion for:', userId)

    // Capture user details BEFORE deletion for activity log
    const { data: userProfile } = await adminClient
      .from('profiles')
      .select('company_name, contact_person, email, phone')
      .eq('id', userId)
      .single()

    const { data: userRoles } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)

    const deletedUserDetails = {
      company_name: userProfile?.company_name || 'Unknown',
      contact_person: userProfile?.contact_person || 'Unknown',
      email: userProfile?.email || 'Unknown',
      phone: userProfile?.phone || 'Unknown',
      roles: userRoles?.map(r => r.role) || [],
    }

    // Track deletion counts for metadata
    const deletionCounts: Record<string, number> = {}

    // ============================================
    // SUPPLIER-RELATED DATA (order matters due to FK)
    // ============================================

    // 1. Delete stock_sync_logs (references supplier_id)
    const { error: syncLogsError, count: syncLogsCount } = await adminClient
      .from('stock_sync_logs')
      .delete()
      .eq('supplier_id', userId)
    if (syncLogsError) console.log('stock_sync_logs delete:', syncLogsError.message)
    else console.log('Deleted stock_sync_logs')
    deletionCounts.stock_sync_logs = syncLogsCount || 0

    // 2. Delete supplier_api_keys (references supplier_id)
    const { error: apiKeysError } = await adminClient
      .from('supplier_api_keys')
      .delete()
      .eq('supplier_id', userId)
    if (apiKeysError) console.log('supplier_api_keys delete:', apiKeysError.message)
    else console.log('Deleted supplier_api_keys')

    // 3. Get all product IDs for this supplier (needed for child table deletions)
    const { data: products } = await adminClient
      .from('products')
      .select('id')
      .eq('supplier_id', userId)
    const productIds = products?.map(p => p.id) || []
    console.log('Found products to delete:', productIds.length)
    deletionCounts.products = productIds.length

    if (productIds.length > 0) {
      // 4. Delete stock_updates (references product_id)
      const { error: stockUpdatesError } = await adminClient
        .from('stock_updates')
        .delete()
        .in('product_id', productIds)
      if (stockUpdatesError) console.log('stock_updates delete:', stockUpdatesError.message)
      else console.log('Deleted stock_updates')

      // 5. Delete stock_inventory (references product_id)
      const { error: stockInventoryError } = await adminClient
        .from('stock_inventory')
        .delete()
        .in('product_id', productIds)
      if (stockInventoryError) console.log('stock_inventory delete:', stockInventoryError.message)
      else console.log('Deleted stock_inventory')

      // 6. Delete product_images (references product_id)
      const { error: productImagesError } = await adminClient
        .from('product_images')
        .delete()
        .in('product_id', productIds)
      if (productImagesError) console.log('product_images delete:', productImagesError.message)
      else console.log('Deleted product_images')
    }

    // 7. Delete products (references supplier_id)
    const { error: productsError } = await adminClient
      .from('products')
      .delete()
      .eq('supplier_id', userId)
    if (productsError) console.log('products delete:', productsError.message)
    else console.log('Deleted products')

    // 8. Get all invoice IDs for this supplier (needed for invoice_items)
    const { data: invoices } = await adminClient
      .from('invoices')
      .select('id')
      .eq('supplier_id', userId)
    const invoiceIds = invoices?.map(i => i.id) || []
    console.log('Found invoices to delete:', invoiceIds.length)
    deletionCounts.invoices = invoiceIds.length

    if (invoiceIds.length > 0) {
      // 9. Delete invoice_items (references invoice_id)
      const { error: invoiceItemsError } = await adminClient
        .from('invoice_items')
        .delete()
        .in('invoice_id', invoiceIds)
      if (invoiceItemsError) console.log('invoice_items delete:', invoiceItemsError.message)
      else console.log('Deleted invoice_items')
    }

    // 10. Delete invoices (references supplier_id)
    const { error: invoicesError } = await adminClient
      .from('invoices')
      .delete()
      .eq('supplier_id', userId)
    if (invoicesError) console.log('invoices delete:', invoicesError.message)
    else console.log('Deleted invoices')

    // 11. Get all PO IDs for this supplier (needed for po_items)
    const { data: purchaseOrders } = await adminClient
      .from('purchase_orders')
      .select('id')
      .eq('supplier_id', userId)
    const poIds = purchaseOrders?.map(po => po.id) || []
    console.log('Found purchase_orders to delete:', poIds.length)

    if (poIds.length > 0) {
      // 12. Delete po_items (references po_id)
      const { error: poItemsError } = await adminClient
        .from('po_items')
        .delete()
        .in('po_id', poIds)
      if (poItemsError) console.log('po_items delete:', poItemsError.message)
      else console.log('Deleted po_items')
    }

    // 13. Delete purchase_orders (references supplier_id)
    const { error: purchaseOrdersError } = await adminClient
      .from('purchase_orders')
      .delete()
      .eq('supplier_id', userId)
    if (purchaseOrdersError) console.log('purchase_orders delete:', purchaseOrdersError.message)
    else console.log('Deleted purchase_orders')

    // 14. Delete bids (references supplier_id)
    const { data: bidsData } = await adminClient
      .from('bids')
      .select('id')
      .eq('supplier_id', userId)
    deletionCounts.bids = bidsData?.length || 0

    const { error: bidsError } = await adminClient
      .from('bids')
      .delete()
      .eq('supplier_id', userId)
    if (bidsError) console.log('bids delete:', bidsError.message)
    else console.log('Deleted bids (supplier)')

    // ============================================
    // BUYER-RELATED DATA
    // ============================================

    // 15. Delete requirements (references buyer_id)
    const { data: reqData } = await adminClient
      .from('requirements')
      .select('id')
      .eq('buyer_id', userId)
    deletionCounts.requirements = reqData?.length || 0

    const { error: requirementsError } = await adminClient
      .from('requirements')
      .delete()
      .eq('buyer_id', userId)
    if (requirementsError) console.log('requirements delete:', requirementsError.message)
    else console.log('Deleted requirements')

    // 16. Delete transactions (references buyer_id OR supplier_id)
    const { error: transactionsBuyerError } = await adminClient
      .from('transactions')
      .delete()
      .eq('buyer_id', userId)
    if (transactionsBuyerError) console.log('transactions (buyer) delete:', transactionsBuyerError.message)
    else console.log('Deleted transactions (buyer)')

    const { error: transactionsSupplierError } = await adminClient
      .from('transactions')
      .delete()
      .eq('supplier_id', userId)
    if (transactionsSupplierError) console.log('transactions (supplier) delete:', transactionsSupplierError.message)
    else console.log('Deleted transactions (supplier)')

    // ============================================
    // LOGISTICS PARTNER-RELATED DATA
    // ============================================

    // 17. Get all shipment IDs for this user (as transporter or customer)
    const { data: shipmentsAsTransporter } = await adminClient
      .from('shipments')
      .select('id')
      .eq('transporter_id', userId)
    const { data: shipmentsAsCustomer } = await adminClient
      .from('shipments')
      .select('id')
      .eq('customer_id', userId)
    const allShipmentIds = [
      ...(shipmentsAsTransporter?.map(s => s.id) || []),
      ...(shipmentsAsCustomer?.map(s => s.id) || [])
    ]
    console.log('Found shipments to delete:', allShipmentIds.length)

    if (allShipmentIds.length > 0) {
      // 18. Delete shipment_updates (references shipment_id)
      const { error: shipmentUpdatesError } = await adminClient
        .from('shipment_updates')
        .delete()
        .in('shipment_id', allShipmentIds)
      if (shipmentUpdatesError) console.log('shipment_updates delete:', shipmentUpdatesError.message)
      else console.log('Deleted shipment_updates')
    }

    // 19. Delete shipments (references transporter_id or customer_id)
    const { error: shipmentsTransporterError } = await adminClient
      .from('shipments')
      .delete()
      .eq('transporter_id', userId)
    if (shipmentsTransporterError) console.log('shipments (transporter) delete:', shipmentsTransporterError.message)
    else console.log('Deleted shipments (transporter)')

    const { error: shipmentsCustomerError } = await adminClient
      .from('shipments')
      .delete()
      .eq('customer_id', userId)
    if (shipmentsCustomerError) console.log('shipments (customer) delete:', shipmentsCustomerError.message)
    else console.log('Deleted shipments (customer)')

    // 20. Delete logistics_transactions (references transporter_id or customer_id)
    const { error: logisticsTransTransporterError } = await adminClient
      .from('logistics_transactions')
      .delete()
      .eq('transporter_id', userId)
    if (logisticsTransTransporterError) console.log('logistics_transactions (transporter) delete:', logisticsTransTransporterError.message)
    else console.log('Deleted logistics_transactions (transporter)')

    const { error: logisticsTransCustomerError } = await adminClient
      .from('logistics_transactions')
      .delete()
      .eq('customer_id', userId)
    if (logisticsTransCustomerError) console.log('logistics_transactions (customer) delete:', logisticsTransCustomerError.message)
    else console.log('Deleted logistics_transactions (customer)')

    // 21. Delete logistics_bids (references transporter_id)
    const { error: logisticsBidsError } = await adminClient
      .from('logistics_bids')
      .delete()
      .eq('transporter_id', userId)
    if (logisticsBidsError) console.log('logistics_bids delete:', logisticsBidsError.message)
    else console.log('Deleted logistics_bids')

    // 22. Delete logistics_requirements (references customer_id)
    const { error: logisticsReqError } = await adminClient
      .from('logistics_requirements')
      .delete()
      .eq('customer_id', userId)
    if (logisticsReqError) console.log('logistics_requirements delete:', logisticsReqError.message)
    else console.log('Deleted logistics_requirements')

    // 23. Delete vehicles (references partner_id)
    const { data: vehiclesData } = await adminClient
      .from('vehicles')
      .select('id')
      .eq('partner_id', userId)
    deletionCounts.vehicles = vehiclesData?.length || 0

    const { error: vehiclesError } = await adminClient
      .from('vehicles')
      .delete()
      .eq('partner_id', userId)
    if (vehiclesError) console.log('vehicles delete:', vehiclesError.message)
    else console.log('Deleted vehicles')

    // 24. Delete warehouses (references partner_id)
    const { data: warehousesData } = await adminClient
      .from('warehouses')
      .select('id')
      .eq('partner_id', userId)
    deletionCounts.warehouses = warehousesData?.length || 0

    const { error: warehousesError } = await adminClient
      .from('warehouses')
      .delete()
      .eq('partner_id', userId)
    if (warehousesError) console.log('warehouses delete:', warehousesError.message)
    else console.log('Deleted warehouses')

    // ============================================
    // COMMON USER DATA (already implemented)
    // ============================================

    // 25. Delete notifications
    const { error: notifError } = await adminClient
      .from('notifications')
      .delete()
      .eq('user_id', userId)
    if (notifError) console.log('notifications delete:', notifError.message)
    else console.log('Deleted notifications')

    // 26. Delete TOTP secrets
    const { error: totpError } = await adminClient
      .from('user_totp_secrets')
      .delete()
      .eq('user_id', userId)
    if (totpError) console.log('user_totp_secrets delete:', totpError.message)
    else console.log('Deleted user_totp_secrets')

    // 27. Delete user roles
    const { error: rolesError } = await adminClient
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
    if (rolesError) console.log('user_roles delete:', rolesError.message)
    else console.log('Deleted user_roles')

    // 28. Delete subscriptions
    const { error: subError } = await adminClient
      .from('subscriptions')
      .delete()
      .eq('user_id', userId)
    if (subError) console.log('subscriptions delete:', subError.message)
    else console.log('Deleted subscriptions')

    // 29. Delete documents
    const { error: docsError } = await adminClient
      .from('documents')
      .delete()
      .eq('user_id', userId)
    if (docsError) console.log('documents delete:', docsError.message)
    else console.log('Deleted documents')

    // 30. Delete platform invoices
    const { error: platformInvoicesError } = await adminClient
      .from('platform_invoices')
      .delete()
      .eq('user_id', userId)
    if (platformInvoicesError) console.log('platform_invoices delete:', platformInvoicesError.message)
    else console.log('Deleted platform_invoices')

    // 31. Delete profile (profile.id = user.id)
    const { error: profileError } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', userId)
    if (profileError) console.log('profiles delete:', profileError.message)
    else console.log('Deleted profile')

    console.log('All related data deleted, now deleting auth user:', userId)

    // Finally delete from auth.users
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Delete auth user error:', deleteError)
      return new Response(JSON.stringify({ error: 'Failed to delete user: ' + deleteError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('User deleted successfully:', userId)

    // Log the activity for audit purposes
    const { error: activityLogError } = await adminClient
      .from('admin_activity_logs')
      .insert({
        admin_id: currentUser.id,
        action_type: 'user_deletion',
        target_type: 'user',
        target_id: userId,
        target_details: deletedUserDetails,
        metadata: {
          deletion_counts: deletionCounts,
          deleted_at: new Date().toISOString(),
        },
      })

    if (activityLogError) {
      console.error('Failed to log activity:', activityLogError)
      // Don't fail the request if logging fails
    } else {
      console.log('Activity logged successfully')
    }

    return new Response(JSON.stringify({ success: true, message: 'User deleted successfully' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in delete-user function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
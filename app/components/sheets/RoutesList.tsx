import React, { memo, useEffect, useState } from "react";
import { ActivityIndicator, View, TouchableOpacity, Text, NativeSyntheticEvent } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SegmentedControl, { NativeSegmentedControlIOSChangeEvent } from "@react-native-segmented-control/segmented-control";
import { BottomSheetModal, BottomSheetView, BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { FontAwesome } from '@expo/vector-icons';

import { IDirectionList, IMapRoute } from "../../../utils/interfaces";
import useAppStore from "../../stores/useAppStore";
import BusIcon from "../ui/BusIcon";
import SheetHeader from "../ui/SheetHeader";
import AlertPill from "../ui/AlertPill";

interface SheetProps {
    sheetRef: React.RefObject<BottomSheetModal>
}

// Display routes list for all routes and favorite routes
const RoutesList: React.FC<SheetProps> = ({ sheetRef }) => {
    const routes = useAppStore((state) => state.routes);
    const setSelectedRoute = useAppStore((state) => state.setSelectedRoute);
    
    const selectedRouteCategory = useAppStore(state => state.selectedRouteCategory);
    const setSelectedRouteCategory = useAppStore(state => state.setSelectedRouteCategory);

    const drawnRoutes = useAppStore((state) => state.drawnRoutes);
    const setDrawnRoutes = useAppStore((state) => state.setDrawnRoutes);
    
    const presentSheet = useAppStore((state) => state.presentSheet);

    const [favoriteRoutes, setFavoriteRoutes] = useState<IMapRoute[]>([]);
    
    const handleRouteSelected = (selectedRoute: IMapRoute) => {        
        setSelectedRoute(selectedRoute);
        setDrawnRoutes([selectedRoute]);
        presentSheet("routeDetails");
    }

    // load favorite routes from async storage
    function loadFavorites() {
        AsyncStorage.getItem('favorites').then((favorites: string | null) => {
            if (!favorites) return;

            const favoritesArray = JSON.parse(favorites);

            setFavoriteRoutes(routes.filter(route => favoritesArray.includes(route.key)));
        })
    }

    // Load favorites on first render
    useEffect(() => loadFavorites(), [routes]);

    // Update the shown routes when the selectedRouteCategory changes
    useEffect(() => {
        if (selectedRouteCategory === "all") {
            setDrawnRoutes(routes);
        } else {
            setDrawnRoutes(favoriteRoutes);
        }
    }, [selectedRouteCategory, routes, favoriteRoutes]);



    // Update the favorites when the view is focused
    function onAnimate(from: number, _: number) {
        if (from === -1) {
            loadFavorites();

            // match the selectedRouteCategory on the map
            if (selectedRouteCategory === "all") {
                setDrawnRoutes(routes);
            } else {
                setDrawnRoutes(favoriteRoutes);
            }
        }
    }

    const handleSetSelectedRouteCategory = (evt: NativeSyntheticEvent<NativeSegmentedControlIOSChangeEvent>) => {
        setSelectedRouteCategory(evt.nativeEvent.selectedSegmentIndex === 0 ? "all" : "favorites");
    }

    const snapPoints = ['25%', '45%', '85%'];

    return (
        <BottomSheetModal 
            ref={sheetRef} 
            snapPoints={snapPoints} 
            index={1} 
            enableDismissOnClose={false}
            enablePanDownToClose={false}
            onAnimate={onAnimate}
        >
            <BottomSheetView>
                <SheetHeader 
                    title="Routes" 
                    icon={<AlertPill />}
                />

                <SegmentedControl
                    values={['All Routes', 'Favorites']}
                    selectedIndex={selectedRouteCategory === 'all' ? 0 : 1}
                    style={{ marginHorizontal: 16 }}
                    onChange={handleSetSelectedRouteCategory}
                />
                <View style={{height: 1, backgroundColor: "#eaeaea", marginTop: 8}} />

                { selectedRouteCategory === "favorites" && drawnRoutes.length === 0 && (
                    <View style={{ alignItems: 'center', marginTop: 16 }}>
                        <Text>You have no favorited routes.</Text>
                    </View>
                )}

                {/* Loading indicatior */}
                { routes.length == 0 && <ActivityIndicator style={{ marginTop: 12 }} /> }
            </BottomSheetView>

            <BottomSheetFlatList
                contentContainerStyle={{ paddingBottom: 35 }}
                data={drawnRoutes}
                keyExtractor={(route: IMapRoute) => route.key}
                style={{ marginLeft: 16 }}
                renderItem={({item: route}) => {
                    return (
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }} onPress={() => handleRouteSelected(route)}>
                            <BusIcon name={route.shortName} color={route.directionList[0]?.lineColor ?? "#000"} style={{ marginRight: 12 }} />
                            <View>                                
                                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                    <Text style={{ fontWeight: 'bold', fontSize: 20, lineHeight: 28 }}>{route.name}</Text>
                                    {favoriteRoutes.includes(route) && 
                                        <FontAwesome name="star" size={16} color="#ffcc01" style={{marginLeft: 4}} />
                                    }
                                </View>
                                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                    {route.directionList.map((elm: IDirectionList, index: number) => (
                                        <React.Fragment key={index}>
                                            <Text>{elm.destination}</Text>
                                            {index !== route.directionList.length - 1 && <Text style={{ marginHorizontal: 2 }}>|</Text>}
                                        </React.Fragment>
                                    ))}
                                </View>
                            </View>
                        </TouchableOpacity>
                    )
                }}
            />
            
        </BottomSheetModal>
    )
}

export default memo(RoutesList)